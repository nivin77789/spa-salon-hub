import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUsers, FaTrophy, FaChartBar, FaCalendar } from "react-icons/fa";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Staff, Customer } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";

const CustomersDashboard = () => {
  const { branchId } = useParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    regularCustomers: 0,
    topTherapist: { name: "", count: 0 }
  });

  useEffect(() => {
    loadData();
  }, [branchId, startDate, endDate]);

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

      // Load customers
      const customerQuery = query(
        collection(db, "customers"),
        where("branchId", "==", branchId)
      );
      const customerSnapshot = await getDocs(customerQuery);
      const allCustomers = customerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];

      // Filter by date range
      const filteredCustomers = allCustomers.filter(c => {
        return c.date >= startDate && c.date <= endDate;
      });
      setCustomers(filteredCustomers);

      // Calculate stats
      const newCustomers = filteredCustomers.filter(c => c.type === 'new').length;
      const regularCustomers = filteredCustomers.filter(c => c.type === 'regular').length;

      // Find top therapist
      const therapistCount = new Map<string, number>();
      filteredCustomers.forEach(customer => {
        const count = therapistCount.get(customer.therapistId) || 0;
        therapistCount.set(customer.therapistId, count + 1);
      });

      let topTherapist = { name: "", count: 0 };
      therapistCount.forEach((count, therapistId) => {
        if (count > topTherapist.count) {
          const staff = staffsData.find(s => s.id === therapistId);
          if (staff) {
            topTherapist = { name: `${staff.firstName} ${staff.lastName}`, count };
          }
        }
      });

      setStats({
        totalCustomers: filteredCustomers.length,
        newCustomers,
        regularCustomers,
        topTherapist
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const getStaffCustomerCount = (staffId: string) => {
    return customers.filter(c => c.therapistId === staffId).length;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customers Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track customer visits and therapist performance</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FaUsers className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
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
                  <FaCalendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Customers</p>
                  <p className="text-2xl font-bold">{stats.newCustomers}</p>
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
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FaChartBar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Regular Customers</p>
                  <p className="text-2xl font-bold">{stats.regularCustomers}</p>
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
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <FaTrophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Therapist</p>
                  <p className="text-lg font-bold truncate">{stats.topTherapist.name || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">{stats.topTherapist.count} customers</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6">Therapist Performance</h2>
          <div className="space-y-4">
            {staffs
              .filter(s => s.role === 'therapist')
              .map((staff, index) => {
                const customerCount = getStaffCustomerCount(staff.id);
                const maxCount = Math.max(...staffs.filter(s => s.role === 'therapist').map(s => getStaffCustomerCount(s.id)));
                const percentage = maxCount > 0 ? Math.round((customerCount / maxCount) * 100) : 0;
                
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
                        <p className="text-sm text-muted-foreground">@{staff.nickname}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{customerCount}</p>
                        <p className="text-xs text-muted-foreground">customers</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full gradient-secondary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {staffs.filter(s => s.role === 'therapist').length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No therapists found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomersDashboard;
