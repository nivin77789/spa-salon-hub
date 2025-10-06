import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlus, FaSearch, FaClock } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { Staff, Customer, Attendance } from "@/types";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const CustomersPage = () => {
  const { branchId } = useParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [presentStaffs, setPresentStaffs] = useState<Staff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    type: "new" as Customer['type'],
    checkInTime: "",
    therapyDuration: "60",
    therapistId: ""
  });

  useEffect(() => {
    loadCustomers();
    loadStaffs();
  }, [branchId]);

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

      // Filter present staffs
      const present = allStaffs.filter(staff => presentStaffIds.includes(staff.id));
      setPresentStaffs(present);
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
    if (!formData.name || !formData.phone || !formData.checkInTime || !formData.therapistId) {
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
        checkOutTime,
        therapistName: therapist.nickname,
        date: new Date().toISOString().split('T')[0],
        branchId
      });
      toast.success("Customer added successfully");
      setFormData({
        name: "",
        phone: "",
        type: "new",
        checkInTime: "",
        therapyDuration: "60",
        therapistId: ""
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Customer Walk-ins</h1>
            <p className="text-muted-foreground mt-1">Manage daily customer visits</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
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
                  <Label htmlFor="therapist">Therapist (Present Only)</Label>
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

        <div className="grid gap-4">
          {customers.map((customer, index) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="bg-card rounded-xl p-6 shadow-lg">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-semibold text-lg">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                      customer.type === 'regular' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {customer.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Therapist</p>
                    <p className="font-medium">{customer.therapistName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timing</p>
                    <div className="flex items-center gap-2 mt-1">
                      <FaClock className="text-primary" />
                      <p className="font-medium">
                        {customer.checkInTime} - {customer.checkOutTime}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration: {customer.therapyDuration} mins
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {customers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No customers today</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomersPage;
