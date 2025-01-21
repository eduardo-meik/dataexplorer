import React from 'react';
import { Database, BarChart2, Settings, LogOut, Menu, X as XIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="h-full bg-white shadow-lg">
      <div className="flex items-center justify-between p-4">
        <h1 className={`font-bold text-xl ${!isOpen && 'hidden'}`}>DataExplorer</h1>
        <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-lg">
          {isOpen ? <XIcon size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      <nav className="mt-8">
        <SidebarItem icon={Database} text="Datasets" isOpen={isOpen} />
        <SidebarItem icon={BarChart2} text="Visualizations" isOpen={isOpen} />
        <SidebarItem icon={Settings} text="Settings" isOpen={isOpen} />
        
        <div className="absolute bottom-4 w-full">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-4 hover:bg-gray-100"
          >
            <LogOut size={20} />
            {isOpen && <span className="ml-4">Logout</span>}
          </button>
        </div>
      </nav>
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ElementType;
  text: string;
  isOpen: boolean;
}

function SidebarItem({ icon: Icon, text, isOpen }: SidebarItemProps) {
  return (
    <button className="flex items-center w-full p-4 hover:bg-gray-100">
      <Icon size={20} />
      {isOpen && <span className="ml-4">{text}</span>}
    </button>
  );
}