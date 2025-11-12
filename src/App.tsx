import { DashboardPage } from '@/components/pages/DashboardPage';
import { I18nProvider } from '@/i18n/I18nProvider';

function App() {
  return (
    <I18nProvider>
      <DashboardPage />
    </I18nProvider>
  );
}

export default App;