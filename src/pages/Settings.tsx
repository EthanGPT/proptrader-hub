import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { AccountSizingManager } from "@/components/ml/AccountSizingManager";
import { Settings2 } from "lucide-react";

const Settings = () => {
  const { user, isConfigured } = useAuth();

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-xl font-semibold">Supabase Not Configured</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Settings</h2>
          <p className="text-muted-foreground">Sign in to access settings</p>
        </div>
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Settings2 className="h-6 w-6" />
          Settings
        </h1>
        <p className="page-subtitle">Manage ML trading accounts, position sizing, and configuration</p>
      </div>

      {/* Account Sizing Manager */}
      <AccountSizingManager />
    </div>
  );
};

export default Settings;
