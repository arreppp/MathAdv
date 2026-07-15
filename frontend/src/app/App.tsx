import { AuthBootstrap } from './AuthBootstrap'
import { AppProviders } from './providers'
import { AppRouter } from './router'

function App() {
  return (
    <AppProviders>
      <AuthBootstrap>
        <AppRouter />
      </AuthBootstrap>
    </AppProviders>
  )
}

export default App
