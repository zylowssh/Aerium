 import { useState, useEffect, useCallback } from 'react';
 import { useLocation } from 'react-router-dom';
 
 const TOUR_STORAGE_KEY = 'aerium_tour_completed';
 
 export interface TourStep {
   id: string;
   target: string;
   title: string;
   content: string;
   placement?: 'top' | 'bottom' | 'left' | 'right';
   page?: string;
 }
 
 export const tourSteps: TourStep[] = [
   {
     id: 'welcome',
     target: '[data-tour="dashboard"]',
     title: 'Bienvenue sur Aerium ! 👋',
     content: 'Aerium vous aide à surveiller la qualité de l\'air en temps réel. Suivez ce guide pour découvrir les fonctionnalités principales.',
     placement: 'bottom',
     page: '/dashboard'
   },
   {
     id: 'kpi-cards',
     target: '[data-tour="kpi-cards"]',
     title: 'Indicateurs Clés',
     content: 'Ces cartes affichent les métriques essentielles : CO₂ moyen, température, humidité et score de santé global.',
     placement: 'bottom',
     page: '/dashboard'
   },
   {
     id: 'air-quality',
     target: '[data-tour="air-quality"]',
     title: 'Qualité de l\'Air',
     content: 'Visualisez l\'évolution du CO₂ sur les dernières heures avec ce graphique interactif.',
     placement: 'right',
     page: '/dashboard'
   },
   {
     id: 'alerts',
     target: '[data-tour="alerts"]',
     title: 'Alertes en Temps Réel',
     content: 'Recevez des notifications instantanées lorsque les seuils de qualité de l\'air sont dépassés.',
     placement: 'left',
     page: '/dashboard'
   },
   {
     id: 'sensors',
     target: '[data-tour="sensors"]',
     title: 'Vos Capteurs',
     content: 'Gérez vos capteurs ici. Ajoutez des capteurs réels (SDC30) ou utilisez le mode simulation pour tester.',
     placement: 'top',
     page: '/dashboard'
   },
   {
     id: 'add-sensor',
     target: '[data-tour="add-sensor"]',
     title: 'Ajouter un Capteur',
     content: 'Cliquez ici pour ajouter un nouveau capteur à votre réseau de surveillance.',
     placement: 'bottom',
     page: '/dashboard'
   },
   {
     id: 'notifications',
     target: '[data-tour="notifications"]',
     title: 'Notifications',
     content: 'Accédez à toutes vos notifications et alertes depuis ce panneau.',
     placement: 'bottom',
     page: '/dashboard'
   },
   {
     id: 'theme',
     target: '[data-tour="theme"]',
     title: 'Mode Sombre / Clair',
     content: 'Basculez entre le mode sombre et clair selon vos préférences.',
     placement: 'bottom',
     page: '/dashboard'
   },
   // Analytics page steps
   {
     id: 'analytics-page',
     target: '[data-tour="analytics-page"]',
     title: 'Page Analyses 📊',
     content: 'Explorez les tendances de qualité de l\'air sur différentes périodes (24h, 7 jours, 30 jours).',
     placement: 'bottom',
     page: '/analytics'
   },
   {
     id: 'analytics-charts',
     target: '[data-tour="analytics-charts"]',
     title: 'Graphiques Interactifs',
     content: 'Visualisez les métriques CO₂, température et humidité avec des graphiques détaillés.',
     placement: 'bottom',
     page: '/analytics'
   },
   {
     id: 'analytics-stats',
     target: '[data-tour="analytics-stats"]',
     title: 'Statistiques Clés',
     content: 'Consultez les statistiques de qualité de l\'air : temps optimal, pics de CO₂, et nombre de lectures.',
     placement: 'top',
     page: '/analytics'
   },
   // Sensors page steps
   {
     id: 'sensors-page',
     target: '[data-tour="sensors-page"]',
     title: 'Gestion des Capteurs 📡',
     content: 'Gérez tous vos capteurs depuis cette page. Ajoutez, modifiez ou supprimez des capteurs.',
     placement: 'bottom',
     page: '/sensors'
   },
   {
     id: 'sensors-table',
     target: '[data-tour="sensors-table"]',
     title: 'Tableau des Capteurs',
     content: 'Consultez les données en temps réel de chaque capteur : CO₂, température, humidité et statut.',
     placement: 'top',
     page: '/sensors'
   },
   {
     id: 'sensors-add',
     target: '[data-tour="sensors-add"]',
     title: 'Ajouter un Nouveau Capteur',
     content: 'Cliquez ici pour ajouter un capteur réel (SDC30) ou en mode simulation.',
     placement: 'bottom',
     page: '/sensors'
   },
   {
     id: 'tour-button',
     target: '[data-tour="tour-button"]',
     title: 'Relancer le Guide',
     content: 'Vous pouvez relancer ce guide à tout moment en cliquant sur ce bouton. Bonne exploration !',
     placement: 'bottom',
     page: '/dashboard'
   }
 ];
 
 export const useTour = () => {
   const [isOpen, setIsOpen] = useState(false);
   const [currentStep, setCurrentStep] = useState(0);
   const [hasCompletedTour, setHasCompletedTour] = useState(true);
   const location = useLocation();

   // Get steps for current page
   const currentPageSteps = tourSteps.filter(step => step.page === location.pathname);
   const allSteps = tourSteps;
 
   useEffect(() => {
     const completed = localStorage.getItem(TOUR_STORAGE_KEY);
     if (!completed) {
       setHasCompletedTour(false);
     }
   }, []);
 
   // Get the step data based on whether we're doing a full tour or page-specific
   const getSteps = () => allSteps;

   const startTour = useCallback(() => {
     setCurrentStep(0);
     setIsOpen(true);
   }, []);
 
   const startPageTour = useCallback(() => {
     // Find the first step for the current page
     const firstPageStepIndex = allSteps.findIndex(step => step.page === location.pathname);
     if (firstPageStepIndex !== -1) {
       setCurrentStep(firstPageStepIndex);
       setIsOpen(true);
     }
   }, [location.pathname]);

   const nextStep = useCallback(() => {
     if (currentStep < allSteps.length - 1) {
       setCurrentStep(prev => prev + 1);
     } else {
       completeTour();
     }
   }, [currentStep]);
 
   const prevStep = useCallback(() => {
     if (currentStep > 0) {
       setCurrentStep(prev => prev - 1);
     }
   }, [currentStep]);
 
   const completeTour = useCallback(() => {
     setIsOpen(false);
     setHasCompletedTour(true);
     localStorage.setItem(TOUR_STORAGE_KEY, 'true');
   }, []);
 
   const skipTour = useCallback(() => {
     completeTour();
   }, [completeTour]);
 
   return {
     isOpen,
     currentStep,
     totalSteps: tourSteps.length,
     currentStepData: tourSteps[currentStep],
     hasCompletedTour,
     startTour,
     nextStep,
     prevStep,
     skipTour,
     completeTour,
     startPageTour,
     currentPageSteps
   };
 };