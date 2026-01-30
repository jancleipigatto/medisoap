/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Agenda from './pages/Agenda';
import AnamnesisDetail from './pages/AnamnesisDetail';
import AtestadoTemplates from './pages/AtestadoTemplates';
import CIDManagement from './pages/CIDManagement';
import CompletarPerfil from './pages/CompletarPerfil';
import ConvenioManagement from './pages/ConvenioManagement';
import DashboardSettings from './pages/DashboardSettings';
import EncaminhamentoTemplates from './pages/EncaminhamentoTemplates';
import ExameTemplates from './pages/ExameTemplates';
import History from './pages/History';
import Home from './pages/Home';
import MedicamentosDatabase from './pages/MedicamentosDatabase';
import NewAnamnesis from './pages/NewAnamnesis';
import NovaOrientacao from './pages/NovaOrientacao';
import NovaReceita from './pages/NovaReceita';
import NovoAtestado from './pages/NovoAtestado';
import NovoEncaminhamento from './pages/NovoEncaminhamento';
import NovoExame from './pages/NovoExame';
import OrientacoesTemplates from './pages/OrientacoesTemplates';
import PatientHistory from './pages/PatientHistory';
import Patients from './pages/Patients';
import ProfileManagement from './pages/ProfileManagement';
import ReceitaTemplates from './pages/ReceitaTemplates';
import Recepcao from './pages/Recepcao';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import Tools from './pages/Tools';
import Triagem from './pages/Triagem';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Agenda": Agenda,
    "AnamnesisDetail": AnamnesisDetail,
    "AtestadoTemplates": AtestadoTemplates,
    "CIDManagement": CIDManagement,
    "CompletarPerfil": CompletarPerfil,
    "ConvenioManagement": ConvenioManagement,
    "DashboardSettings": DashboardSettings,
    "EncaminhamentoTemplates": EncaminhamentoTemplates,
    "ExameTemplates": ExameTemplates,
    "History": History,
    "Home": Home,
    "MedicamentosDatabase": MedicamentosDatabase,
    "NewAnamnesis": NewAnamnesis,
    "NovaOrientacao": NovaOrientacao,
    "NovaReceita": NovaReceita,
    "NovoAtestado": NovoAtestado,
    "NovoEncaminhamento": NovoEncaminhamento,
    "NovoExame": NovoExame,
    "OrientacoesTemplates": OrientacoesTemplates,
    "PatientHistory": PatientHistory,
    "Patients": Patients,
    "ProfileManagement": ProfileManagement,
    "ReceitaTemplates": ReceitaTemplates,
    "Recepcao": Recepcao,
    "Settings": Settings,
    "Templates": Templates,
    "Tools": Tools,
    "Triagem": Triagem,
    "UserManagement": UserManagement,
    "UserProfile": UserProfile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};