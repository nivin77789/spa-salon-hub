import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlus, FaStore } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Branch } from "@/types";
import { toast } from "sonner";

const BranchesPage = () => {
  const { type } = useParams<{ type: 'spa' | 'salon' }>();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchName, setBranchName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBranches();
  }, [type]);

  const loadBranches = async () => {
    try {
      const q = query(collection(db, "branches"), where("type", "==", type));
      const querySnapshot = await getDocs(q);
      const branchesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Branch[];
      setBranches(branchesData);
    } catch (error) {
      console.error("Error loading branches:", error);
      toast.error("Failed to load branches");
    }
  };

  const handleAddBranch = async () => {
    if (!branchName.trim()) {
      toast.error("Please enter a branch name");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "branches"), {
        name: branchName,
        type: type,
        createdAt: new Date()
      });
      toast.success("Branch added successfully");
      setBranchName("");
      setIsDialogOpen(false);
      loadBranches();
    } catch (error) {
      console.error("Error adding branch:", error);
      toast.error("Failed to add branch");
    } finally {
      setLoading(false);
    }
  };

  const handleBranchClick = (branchId: string) => {
    navigate(`/login/${branchId}`);
  };

  return (
    <div className="min-h-screen gradient-hero p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 capitalize">
            {type} Branches
          </h1>
          <p className="text-muted-foreground">
            Select a branch to manage or add a new one
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="cursor-pointer"
              >
                <div className="h-48 rounded-xl border-2 border-dashed border-primary/50 hover:border-primary bg-card card-hover flex flex-col items-center justify-center gap-4">
                  <FaPlus className="w-12 h-12 text-primary" />
                  <p className="text-lg font-semibold text-primary">Add New Branch</p>
                </div>
              </motion.div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Branch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    placeholder="Enter branch name"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAddBranch}
                  disabled={loading}
                  className="w-full gradient-primary"
                >
                  {loading ? "Adding..." : "Add Branch"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {branches.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * (index + 2) }}
              onClick={() => handleBranchClick(branch.id)}
              className="cursor-pointer"
            >
              <div className="h-48 rounded-xl bg-card shadow-lg card-hover p-6 flex flex-col justify-between">
                <div>
                  <FaStore className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-2xl font-bold mb-1">{branch.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {branch.type} Branch
                  </p>
                </div>
                <Button variant="outline" className="w-full">
                  Access Branch
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BranchesPage;
