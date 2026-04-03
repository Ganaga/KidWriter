import './style.css';
import { registerRoute, initRouter } from './router';
import { renderDashboard } from './modules/dashboard/dashboard';
import { renderWriting } from './modules/writing/writing';
import { renderProfile } from './modules/profile/profile';

registerRoute('', renderDashboard);
registerRoute('writing', renderWriting);
registerRoute('profile', renderProfile);

initRouter();
