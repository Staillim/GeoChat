"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserSearch } from "lucide-react";
import { SearchUserDialog } from "./search-user-dialog";

/**
 * Floating Action Button (FAB) for searching users by PIN.
 * Displays a fixed button in the bottom-right corner that opens a search dialog.
 */
export function SearchUserFab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-[60] md:bottom-6"
        onClick={() => setIsDialogOpen(true)}
        aria-label="Buscar usuario por PIN"
      >
        <UserSearch className="h-6 w-6" />
      </Button>

      <SearchUserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
