import Agenda from './pages/Agenda';
import AnamnesisDetail from './pages/AnamnesisDetail';
import AtestadoTemplates from './pages/AtestadoTemplates';
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
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import Tools from './pages/Tools';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import CIDManagement from './pages/CIDManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Agenda": Agenda,
    "AnamnesisDetail": AnamnesisDetail,
    "AtestadoTemplates": AtestadoTemplates,
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
    "Settings": Settings,
    "Templates": Templates,
    "Tools": Tools,
    "UserManagement": UserManagement,
    "UserProfile": UserProfile,
    "CIDManagement": CIDManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};