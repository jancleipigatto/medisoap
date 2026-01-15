import Home from './pages/Home';
import NewAnamnesis from './pages/NewAnamnesis';
import Patients from './pages/Patients';
import AnamnesisDetail from './pages/AnamnesisDetail';
import Templates from './pages/Templates';
import UserManagement from './pages/UserManagement';
import AtestadoTemplates from './pages/AtestadoTemplates';
import ExameTemplates from './pages/ExameTemplates';
import EncaminhamentoTemplates from './pages/EncaminhamentoTemplates';
import Trash from './pages/Trash';
import History from './pages/History';
import DashboardSettings from './pages/DashboardSettings';
import ProfileManagement from './pages/ProfileManagement';
import Tools from './pages/Tools';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "NewAnamnesis": NewAnamnesis,
    "Patients": Patients,
    "AnamnesisDetail": AnamnesisDetail,
    "Templates": Templates,
    "UserManagement": UserManagement,
    "AtestadoTemplates": AtestadoTemplates,
    "ExameTemplates": ExameTemplates,
    "EncaminhamentoTemplates": EncaminhamentoTemplates,
    "Trash": Trash,
    "History": History,
    "DashboardSettings": DashboardSettings,
    "ProfileManagement": ProfileManagement,
    "Tools": Tools,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};