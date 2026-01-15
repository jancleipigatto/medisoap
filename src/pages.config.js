import AnamnesisDetail from './pages/AnamnesisDetail';
import AtestadoTemplates from './pages/AtestadoTemplates';
import DashboardSettings from './pages/DashboardSettings';
import EncaminhamentoTemplates from './pages/EncaminhamentoTemplates';
import ExameTemplates from './pages/ExameTemplates';
import History from './pages/History';
import Home from './pages/Home';
import NewAnamnesis from './pages/NewAnamnesis';
import Patients from './pages/Patients';
import ProfileManagement from './pages/ProfileManagement';
import Templates from './pages/Templates';
import Tools from './pages/Tools';
import Trash from './pages/Trash';
import UserManagement from './pages/UserManagement';
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
    "Patients": Patients,
    "ProfileManagement": ProfileManagement,
    "Templates": Templates,
    "Tools": Tools,
    "Trash": Trash,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};