import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTrophy, FaChartLine, FaCalendarAlt, FaUsers } from "react-icons/fa";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Staff, Attendance } from "@/types";
import DashboardLayout from "@/components/DashboardLayout";

const AttendanceDashboard = () => {
  const { branchId } = useParams();
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    topAttendee: { name: "", count: 0 },
    lowAttendee: { name: "", count: 0 }
  });

  useEffect(() => {
    loadData();
  }, [branchId]);

  const loadData = async () => {
    try {
      // Load staffs
      const staffQuery = query(collection(db, "staffs"), where("branchId", "==", branchId));
      const staffSnapshot = await getDocs(staffQuery);
      const staffsData = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
      setStaffs(staffsData);

      // Load attendance for current month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      const startDate = firstDayOfMonth.toISOString().split('T')[0];
      
      const attendanceQuery = query(
        collection(db, "attendances"),
        where("branchId", "==", branchId)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendancesData = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Attendance[];
      setAttendances(attendancesData);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendancesData.filter(a => a.date === today && a.status !== 'absent');
      
      // Calculate monthly attendance count for each staff
      const staffAttendanceCount = new Map<string, number>();
      attendancesData.forEach(attendance => {
        if (attendance.status !== 'absent') {
          const count = staffAttendanceCount.get(attendance.staffId) || 0;
          staffAttendanceCount.set(attendance.staffId, count + 1);
        }
      });

      let topAttendee = { name: "", count: 0 };
      let lowAttendee = { name: "", count: Infinity };

      staffsData.forEach(staff => {
        const count = staffAttendanceCount.get(staff.id) || 0;
        if (count > topAttendee.count) {
          topAttendee = { name: `${staff.firstName} ${staff.lastName}`, count };
        }
        if (count < lowAttendee.count && count > 0) {
          lowAttendee = { name: `${staff.firstName} ${staff.lastName}`, count };
        }
      });

      if (lowAttendee.count === Infinity) {
        lowAttendee = { name: "N/A", count: 0 };
      }

      setStats({
        totalStaff: staffsData.length,
        presentToday: todayAttendance.length,
        topAttendee,
        lowAttendee
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const getStaffAttendanceHistory = (staffId: string) => {
    return attendances.filter(a => a.staffId === staffId);
  };

  const calculateAttendancePercentage = (staffId: string) => {
    const history = getStaffAttendanceHistory(staffId);
    const presentDays = history.filter(a => a.status !== 'absent').length;
    const totalDays = history.length;
    return totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track staff attendance and performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FaUsers className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Staff</p>
                  <p className="text-2xl font-bold">{stats.totalStaff}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <FaCalendarAlt className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Present Today</p>
                  <p className="text-2xl font-bold">{stats.presentToday}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <FaTrophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Attendee</p>
                  <p className="text-lg font-bold truncate">{stats.topAttendee.name || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">{stats.topAttendee.count} days</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <FaChartLine className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Needs Improvement</p>
                  <p className="text-lg font-bold truncate">{stats.lowAttendee.name || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">{stats.lowAttendee.count} days</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6">Staff Performance Overview</h2>
          <div className="space-y-4">
            {staffs.map((staff, index) => {
              const percentage = calculateAttendancePercentage(staff.id);
              const history = getStaffAttendanceHistory(staff.id);
              const presentDays = history.filter(a => a.status !== 'absent').length;
              
              return (
                <motion.div
                  key={staff.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">{staff.firstName} {staff.lastName}</p>
                      <p className="text-sm text-muted-foreground">@{staff.nickname} • {staff.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{percentage}%</p>
                      <p className="text-xs text-muted-foreground">{presentDays}/{history.length} days</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full gradient-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {staffs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No staff members found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceDashboard;
