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
        className="fixed bottom-20 right-6 h-16 w-16 rounded-full shadow-2xl hover:shadow-primary/50 transition-all z-[60] md:bottom-6 group overflow-hidden bg-gradient-to-br from-primary to-accent hover:scale-110 hover:rotate-12 animate-in zoom-in duration-500"
        onClick={() => setIsDialogOpen(true)}
        aria-label="Buscar usuario por PIN"
      >
        {/* Orbe de fondo animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Efecto shimmer */}
        <div className="absolute inset-0 shimmer-effect" />
        
        {/* Anillo pulsante */}
        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
        
        <UserSearch className="h-7 w-7 relative z-10 transition-transform duration-300 group-hover:scale-110" />
      </Button>

      <SearchUserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
