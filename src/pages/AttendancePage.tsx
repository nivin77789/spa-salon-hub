import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaCheck, FaTimes, FaSearch, FaClock } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { Staff, Attendance } from "@/types";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const AttendancePage = () => {
  const { branchId } = useParams();
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [filterPeriod, setFilterPeriod] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadStaffs();
    loadAttendances();
  }, [branchId, selectedDate]);

  const loadStaffs = async () => {
    try {
      const q = query(collection(db, "staffs"), where("branchId", "==", branchId));
      const querySnapshot = await getDocs(q);
      const staffsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
      setStaffs(staffsData);
    } catch (error) {
      console.error("Error loading staffs:", error);
    }
  };

  const loadAttendances = async () => {
    try {
      const q = query(
        collection(db, "attendances"),
        where("branchId", "==", branchId),
        where("date", "==", selectedDate)
      );
      const querySnapshot = await getDocs(q);
      const attendancesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Attendance[];
      setAttendances(attendancesData);
    } catch (error) {
      console.error("Error loading attendances:", error);
    }
  };

  const handleMarkAttendance = async (
    staffId: string,
    status: 'present' | 'absent' | 'half-day'
  ) => {
    const existingAttendance = attendances.find(a => a.staffId === staffId);
    if (existingAttendance) {
      toast.error("Attendance already marked for this staff today");
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });

    try {
      await addDoc(collection(db, "attendances"), {
        staffId,
        date: selectedDate,
        entryTime: timeString,
        exitTime: "",
        status,
        branchId
      });
      toast.success("Attendance marked successfully");
      loadAttendances();
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    }
  };

  const getAttendanceForStaff = (staffId: string) => {
    return attendances.find(a => a.staffId === staffId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">Mark and track staff attendance</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label>Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label>Filter Period</Label>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Staff Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Role</th>
                  <th className="px-6 py-4 text-left font-semibold">Entry Time</th>
                  <th className="px-6 py-4 text-left font-semibold">Exit Time</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffs.map((staff, index) => {
                  const attendance = getAttendanceForStaff(staff.id);
                  return (
                    <motion.tr
                      key={staff.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{staff.firstName} {staff.lastName}</p>
                          <p className="text-sm text-muted-foreground">@{staff.nickname}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize">{staff.role}</td>
                      <td className="px-6 py-4">
                        {attendance?.entryTime || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {attendance?.exitTime || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {attendance ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            attendance.status === 'present' ? 'bg-green-100 text-green-800' :
                            attendance.status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {attendance.status}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not marked</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!attendance && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleMarkAttendance(staff.id, 'present')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <FaCheck className="mr-1" /> Present
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleMarkAttendance(staff.id, 'absent')}
                              variant="destructive"
                            >
                              <FaTimes className="mr-1" /> Absent
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleMarkAttendance(staff.id, 'half-day')}
                              variant="secondary"
                            >
                              Half Day
                            </Button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {staffs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No staff members found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendancePage;
