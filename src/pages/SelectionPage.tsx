import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaSpa, FaCog } from "react-icons/fa";
import { GiScissors } from "react-icons/gi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getSettings, saveSettings, AppSettings } from "@/lib/settings";
import { toast } from "sonner";

const SelectionPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSelection = (type: 'spa' | 'salon') => {
    navigate(`/branches/${type}`);
  };

  const handleToggleSalon = (checked: boolean) => {
    const newSettings = { ...settings, hideSalon: checked };
    setSettings(newSettings);
    saveSettings(newSettings);
    toast.success(checked ? "Salon option hidden" : "Salon option visible");
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <div className="max-w-6xl w-full relative">
        <div className="absolute top-0 right-0">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <FaCog />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hide-salon">Hide Salon Option</Label>
                  <Switch
                    id="hide-salon"
                    checked={settings.hideSalon}
                    onCheckedChange={handleToggleSalon}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          Welcome to Your Business
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center text-muted-foreground text-lg mb-12"
        >
          Choose your business type to get started
        </motion.p>

        <div className={`grid ${settings.hideSalon ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-2'} gap-8`}>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onClick={() => handleSelection('spa')}
            className="group cursor-pointer"
          >
            <div className="relative h-80 rounded-2xl overflow-hidden card-hover bg-card shadow-lg">
              <div className="absolute inset-0 gradient-primary opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="relative h-full flex flex-col items-center justify-center p-8">
                <FaSpa className="w-24 h-24 text-primary mb-6 group-hover:scale-110 transition-transform" />
                <h2 className="text-4xl font-bold mb-4">Spa</h2>
                <p className="text-muted-foreground text-center">
                  Manage your spa business with ease
                </p>
              </div>
            </div>
          </motion.div>

          {!settings.hideSalon && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={() => handleSelection('salon')}
              className="group cursor-pointer"
            >
              <div className="relative h-80 rounded-2xl overflow-hidden card-hover bg-card shadow-lg">
                <div className="absolute inset-0 gradient-secondary opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="relative h-full flex flex-col items-center justify-center p-8">
                  <GiScissors className="w-24 h-24 text-secondary mb-6 group-hover:scale-110 transition-transform" />
                  <h2 className="text-4xl font-bold mb-4">Salon</h2>
                  <p className="text-muted-foreground text-center">
                    Manage your salon business with ease
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectionPage;
