 import React, { createContext, useContext, ReactNode } from 'react';
 import { useTour, TourStep } from '@/hooks/useTour';
 
  interface TourContextType {
   isOpen: boolean;
   currentStep: number;
   totalSteps: number;
   currentStepData: TourStep;
   hasCompletedTour: boolean;
   startTour: () => void;
   nextStep: () => void;
   prevStep: () => void;
   skipTour: () => void;
   completeTour: () => void;
   startPageTour: () => void;
   currentPageSteps: TourStep[];
 }
 
 const TourContext = createContext<TourContextType | undefined>(undefined);
 
 export function TourProvider({ children }: { children: ReactNode }) {
   const tour = useTour();
 
   return (
     <TourContext.Provider value={tour}>
       {children}
     </TourContext.Provider>
   );
 }
 
 export function useTourContext() {
   const context = useContext(TourContext);
   if (context === undefined) {
     throw new Error('useTourContext must be used within a TourProvider');
   }
   return context;
 }