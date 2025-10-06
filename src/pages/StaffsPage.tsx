import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlus, FaTrash, FaEdit, FaSearch } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from "firebase/firestore";
import { Staff } from "@/types";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const StaffsPage = () => {
  const { branchId } = useParams();
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [filteredStaffs, setFilteredStaffs] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    age: "",
    address: "",
    contact: "",
    aadharNumber: "",
    role: "therapist" as Staff['role']
  });

  useEffect(() => {
    loadStaffs();
  }, [branchId]);

  useEffect(() => {
    const filtered = staffs.filter(staff =>
      staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStaffs(filtered);
  }, [searchTerm, staffs]);

  const loadStaffs = async () => {
    try {
      const q = query(collection(db, "staffs"), where("branchId", "==", branchId));
      const querySnapshot = await getDocs(q);
      const staffsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Staff[];
      setStaffs(staffsData);
      setFilteredStaffs(staffsData);
    } catch (error) {
      console.error("Error loading staffs:", error);
      toast.error("Failed to load staffs");
    }
  };

  const handleAddStaff = async () => {
    if (!formData.firstName || !formData.lastName || !formData.nickname) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "staffs"), {
        ...formData,
        age: parseInt(formData.age),
        branchId,
        createdAt: new Date()
      });
      toast.success("Staff added successfully");
      setFormData({
        firstName: "",
        lastName: "",
        nickname: "",
        age: "",
        address: "",
        contact: "",
        aadharNumber: "",
        role: "therapist"
      });
      setIsDialogOpen(false);
      loadStaffs();
    } catch (error) {
      console.error("Error adding staff:", error);
      toast.error("Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      await deleteDoc(doc(db, "staffs", staffId));
      toast.success("Staff deleted successfully");
      loadStaffs();
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to delete staff");
    }
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      nickname: staff.nickname,
      age: staff.age.toString(),
      address: staff.address,
      contact: staff.contact,
      aadharNumber: staff.aadharNumber,
      role: staff.role
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!formData.firstName || !formData.lastName || !formData.nickname || !editingStaff) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "staffs", editingStaff.id), {
        ...formData,
        age: parseInt(formData.age)
      });
      toast.success("Staff updated successfully");
      setFormData({
        firstName: "",
        lastName: "",
        nickname: "",
        age: "",
        address: "",
        contact: "",
        aadharNumber: "",
        role: "therapist"
      });
      setEditingStaff(null);
      setIsEditDialogOpen(false);
      loadStaffs();
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Failed to update staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground mt-1">Manage your team members</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <FaPlus /> Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Spa Nickname *</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhar">Aadhar Number</Label>
                  <Input
                    id="aadhar"
                    value={formData.aadharNumber}
                    onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: Staff['role']) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="therapist">Therapist</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddStaff}
                disabled={loading}
                className="w-full gradient-primary mt-4"
              >
                {loading ? "Adding..." : "Add Staff Member"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search staffs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaffs.map((staff, index) => (
            <motion.div
              key={staff.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="bg-card rounded-xl p-6 shadow-lg card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
                    {staff.firstName[0]}{staff.lastName[0]}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditStaff(staff)}
                      className="text-primary hover:bg-primary/10"
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">
                  {staff.firstName} {staff.lastName}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">@{staff.nickname}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium capitalize">{staff.role}</span>
                  </div>
                  {staff.contact && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{staff.contact}</span>
                    </div>
                  )}
                  {staff.age && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Age:</span>
                      <span className="font-medium">{staff.age}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredStaffs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No staff members found</p>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNickname">Spa Nickname *</Label>
                <Input
                  id="editNickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAge">Age</Label>
                <Input
                  id="editAge"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="editAddress">Address</Label>
                <Input
                  id="editAddress"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editContact">Contact</Label>
                <Input
                  id="editContact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAadhar">Aadhar Number</Label>
                <Input
                  id="editAadhar"
                  value={formData.aadharNumber}
                  onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: Staff['role']) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="therapist">Therapist</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleUpdateStaff}
              disabled={loading}
              className="w-full gradient-primary mt-4"
            >
              {loading ? "Updating..." : "Update Staff Member"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StaffsPage;
