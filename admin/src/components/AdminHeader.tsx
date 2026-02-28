import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  onLogout: () => void;
}

export const AdminHeader = ({ title, subtitle, onLogout }: AdminHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link to="/admin/orders">Live orders</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/menu">Menu</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/settings">Hours</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/analytics">Analytics</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/promotions">Promotions</Link>
        </Button>
        <Button variant="outline" onClick={onLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
};
