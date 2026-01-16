import AnamnesisDetail from './pages/AnamnesisDetail';
import AtestadoTemplates from './pages/AtestadoTemplates';
import DashboardSettings from './pages/DashboardSettings';
import EncaminhamentoTemplates from './pages/EncaminhamentoTemplates';
import ExameTemplates from './pages/ExameTemplates';
import History from './pages/History';
import Home from './pages/Home';
import NewAnamnesis from './pages/NewAnamnesis';
import NovaReceita from './pages/NovaReceita';
import NovoAtestado from './pages/NovoAtestado';
import NovoEncaminhamento from './pages/NovoEncaminhamento';
import NovoExame from './pages/NovoExame';
import Patients from './pages/Patients';
import ProfileManagement from './pages/ProfileManagement';
import ReceitaTemplates from './pages/ReceitaTemplates';
import Templates from './pages/Templates';
import Tools from './pages/Tools';
import Trash from './pages/Trash';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import CompletarPerfil from './pages/CompletarPerfil';
import PatientHistory from './pages/PatientHistory';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AnamnesisDetail": AnamnesisDetail,
    "AtestadoTemplates": AtestadoTemplates,
    "DashboardSettings": DashboardSettings,
    "EncaminhamentoTemplates": EncaminhamentoTemplates,
    "ExameTemplates": ExameTemplates,
    "History": History,
    "Home": Home,
    "NewAnamnesis": NewAnamnesis,
    "NovaReceita": NovaReceita,
    "NovoAtestado": NovoAtestado,
    "NovoEncaminhamento": NovoEncaminhamento,
    "NovoExame": NovoExame,
    "Patients": Patients,
    "ProfileManagement": ProfileManagement,
    "ReceitaTemplates": ReceitaTemplates,
    "Templates": Templates,
    "Tools": Tools,
    "Trash": Trash,
    "UserManagement": UserManagement,
    "UserProfile": UserProfile,
    "CompletarPerfil": CompletarPerfil,
    "PatientHistory": PatientHistory,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};