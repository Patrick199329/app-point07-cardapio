import { LogOut } from "lucide-react";

import { signOut } from "@/lib/actions/session";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut className="size-4" />
        Sair
      </Button>
    </form>
  );
}
