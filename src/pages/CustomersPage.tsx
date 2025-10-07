import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlus, FaSearch, FaClock, FaSignOutAlt } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { Staff, Customer } from "@/types";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import CustomerTimer from "@/components/CustomerTimer";

const CustomersPage = () => {
  const { branchId } = useParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [presentStaffs, setPresentStaffs] = useState<Staff[]>([]);
  const [busyStaffs, setBusyStaffs] = useState<Staff[]>([]);
  const [freeStaffs, setFreeStaffs] = useState<Staff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    type: "new" as Customer['type'],
    checkInTime: "",
    therapyDuration: "60",
    therapistId: "",
    amount: ""
  });

  useEffect(() => {
    loadCustomers();
  }, [branchId]);

  useEffect(() => {
    loadStaffs();
  }, [branchId, customers]);

  const loadCustomers = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, "customers"),
        where("branchId", "==", branchId),
        where("date", "==", today)
      );
      const querySnapshot = await getDocs(q);
      const customersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadStaffs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Load all therapist staffs
      const staffQuery = query(
        collection(db, "staffs"),
        where("branchId", "==", branchId),
        where("role", "==", "therapist")
      );
      const staffSnapshot = await getDocs(staffQuery);
      const allStaffs = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
      setStaffs(allStaffs);

      // Load today's attendance
      const attendanceQuery = query(
        collection(db, "attendances"),
        where("branchId", "==", branchId),
        where("date", "==", today),
        where("status", "in", ["present", "half-day"])
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const presentStaffIds = attendanceSnapshot.docs.map(doc => doc.data().staffId);

      // Filter present and available staffs (not currently assigned to active customers)
      const activeCustomerStaffIds = customers
        .filter(c => c.isActive)
        .map(c => c.therapistId);
      
      const present = allStaffs.filter(
        staff => presentStaffIds.includes(staff.id) && !activeCustomerStaffIds.includes(staff.id)
      );
      setPresentStaffs(present);

      // Separate busy and free staffs
      const presentStaffsList = allStaffs.filter(staff => presentStaffIds.includes(staff.id));
      const busy = presentStaffsList.filter(staff => activeCustomerStaffIds.includes(staff.id));
      const free = presentStaffsList.filter(staff => !activeCustomerStaffIds.includes(staff.id));
      
      setBusyStaffs(busy);
      setFreeStaffs(free);
    } catch (error) {
      console.error("Error loading staffs:", error);
    }
  };

  const calculateCheckoutTime = (checkIn: string, duration: number) => {
    const [hours, minutes] = checkIn.split(':');
    const checkInDate = new Date();
    checkInDate.setHours(parseInt(hours), parseInt(minutes), 0);
    checkInDate.setMinutes(checkInDate.getMinutes() + duration);
    return checkInDate.toTimeString().slice(0, 5);
  };

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.phone || !formData.checkInTime || !formData.therapistId || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const therapist = presentStaffs.find(s => s.id === formData.therapistId);
    if (!therapist) {
      toast.error("Selected therapist is not available");
      return;
    }

    const checkOutTime = calculateCheckoutTime(formData.checkInTime, parseInt(formData.therapyDuration));

    setLoading(true);
    try {
      await addDoc(collection(db, "customers"), {
        ...formData,
        therapyDuration: parseInt(formData.therapyDuration),
        amount: parseFloat(formData.amount),
        checkOutTime,
        therapistName: therapist.nickname,
        date: new Date().toISOString().split('T')[0],
        branchId,
        isActive: true
      });
      toast.success("Customer added successfully");
      setFormData({
        name: "",
        phone: "",
        type: "new",
        checkInTime: "",
        therapyDuration: "60",
        therapistId: "",
        amount: ""
      });
      setIsDialogOpen(false);
      loadCustomers();
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  const handleExitCustomer = async (customerId: string) => {
    try {
      await updateDoc(doc(db, "customers", customerId), {
        isActive: false
      });
      toast.success("Customer checked out successfully");
      loadCustomers();
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Failed to check out customer");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Customer Walk-ins</h1>
            <p className="text-muted-foreground mt-1">Manage daily customer visits</p>
          </div>
        </div>

        {/* Staff Status Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Busy Staffs */}
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              Busy Therapists ({busyStaffs.length})
            </h3>
            <div className="max-h-32 overflow-y-auto border border-border rounded">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Nickname</th>
                  </tr>
                </thead>
                <tbody>
                  {busyStaffs.map((staff) => (
                    <tr key={staff.id} className="border-b border-border">
                      <td className="px-3 py-2">{staff.firstName} {staff.lastName}</td>
                      <td className="px-3 py-2">@{staff.nickname}</td>
                    </tr>
                  ))}
                  {busyStaffs.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center text-muted-foreground">
                        No busy therapists
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Free Staffs */}
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Free Therapists ({freeStaffs.length})
            </h3>
            <div className="max-h-32 overflow-y-auto border border-border rounded">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Nickname</th>
                  </tr>
                </thead>
                <tbody>
                  {freeStaffs.map((staff) => (
                    <tr key={staff.id} className="border-b border-border">
                      <td className="px-3 py-2">{staff.firstName} {staff.lastName}</td>
                      <td className="px-3 py-2">@{staff.nickname}</td>
                    </tr>
                  ))}
                  {freeStaffs.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center text-muted-foreground">
                        No free therapists
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Therapist</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Time Left</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        customer.type === 'regular' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {customer.type}
                      </span>
                    </TableCell>
                    <TableCell>{customer.therapistName}</TableCell>
                    <TableCell>{customer.checkInTime}</TableCell>
                    <TableCell>{customer.checkOutTime}</TableCell>
                    <TableCell>
                      {customer.isActive ? (
                        <CustomerTimer checkOutTime={customer.checkOutTime} />
                      ) : (
                        <span className="text-muted-foreground">Completed</span>
                      )}
                    </TableCell>
                    <TableCell>₹{customer.amount}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        customer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.isActive ? 'Active' : 'Completed'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {customer.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExitCustomer(customer.id)}
                          className="gap-2"
                        >
                          <FaSignOutAlt /> Exit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {customers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No customers today</p>
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gradient-primary gap-2">
              <FaPlus /> Add Walk-in
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Customer Walk-in</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Customer Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Customer['type']) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-in Time *</Label>
                <Input
                  id="checkIn"
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Therapy Duration</Label>
                <Select
                  value={formData.therapyDuration}
                  onValueChange={(value) => setFormData({ ...formData, therapyDuration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="75">1.15 hours</SelectItem>
                    <SelectItem value="90">1.30 hours</SelectItem>
                    <SelectItem value="105">1.45 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="therapist">Therapist (Available Only)</Label>
                <Select
                  value={formData.therapistId}
                  onValueChange={(value) => setFormData({ ...formData, therapistId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapist" />
                  </SelectTrigger>
                  <SelectContent>
                    {presentStaffs.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.nickname} ({staff.firstName} {staff.lastName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.checkInTime && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Estimated Check-out: {calculateCheckoutTime(formData.checkInTime, parseInt(formData.therapyDuration))}
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={handleAddCustomer}
              disabled={loading}
              className="w-full gradient-primary mt-4"
            >
              {loading ? "Adding..." : "Add Customer"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CustomersPage;
