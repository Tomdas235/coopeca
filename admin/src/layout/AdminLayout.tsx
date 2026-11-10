import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Stack, Toolbar, IconButton, Drawer, ListItem, ListItemText, Avatar, Typography, CssBaseline } from '@mui/material';
import { Home, People, BubbleChart, Dashboard, Settings, Inventory, List, Article } from '@mui/icons-material';
import { Logout } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../app/redux/authSlice';
import { RootState } from '../../app/redux/store';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector<(RootState), any, any>(selectCurrentUser);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté et a le rôle admin
    if (!user || user.role !== 'ADMIN') {
      navigate('/auth/login', { replace: true });
    }
  }, [user, navigate]);

  const drawerWidth = 250;

  const navItems = [
    { key: 'dashboard', label: 'Tableau de bord', icon: Home, path: '/admin' },
    { key: 'clients', label: 'Clients', icon: People, path: '/admin/clients' },
    { key: 'dossiers', label: 'Dossiers', icon: List, path: '/admin/dossiers' },
    { key: 'collectes', label: 'Collectes', icon: Article, path: '/admin/collectes' },
    { key: 'retraits', label: 'Retraits', icon: BubbleChart, path: '/admin/retraits' },
    { key: 'agents', label: 'Agents', icon: People, path: '/admin/agents' },
    { key: 'agences', label: 'Agences', icon: Inventory, path: '/admin/agences' },
    { key: 'marche', label: 'Marchés', icon: List, path: '/admin/marche' },
    { key: 'parametres', label: 'Paramètres', icon: Settings, path: '/admin/parametres' },
  ];

  return (
    <Box sx={{ display: { sm: 'flex' }, height: '100%' }}>
      <CssBaseline />

      {/* Sidebar */}
      <Drawer
        variant="persistent"
        sx={{ width: drawerWidth, flexShrink: 0 }}
        anchor="left"
        open
      >
        <Container maxWidth={false}>
          <Toolbar variant="h6" disable Elevation>
            <IconButton edge="start" color="inherit" aria-label="open drawer">
              <IconButton
                sx={{ m: 1 }}
                onClick={() => navigate('/auth/login', { replace: true })}
              >
                {Logout}
              </IconButton>
            </IconButton>
            <Typography variant="h6" noWrap>
              COOPECA Admin
            </Typography>
          </Toolbar>

          <Stack direction="vertical" alignItems="start" overflowAuto>
            {navItems.map((item) => (
              <ListItem
                key={item.key}
                button
                sx={{
                  my: 2,
                  borderRadius: 8,
                  color: user?.role === 'ADMIN' ? 'initial' : 'inherit',
                  '& .MuiListItemText-primary': { fontWeight: user?.role === 'ADMIN' ? '500' : 'initial' },
                  '& .MuiListItemText-secondary': { color: user?.role === 'ADMIN' ? 'text.secondary' : 'initial' },
                }}
                onClick={() => navigate(item.path)}
                component="li"
              >
                <ListItemText primary={item.label} startIcon={item.icon} />
              </ListItem>
            ))}

            <Divider style={{ my: 4 }} />
            <ListItem button component="li">
              <ListItemText primary="Déconnexion" startIcon={<Logout />} sx={{ color: 'error' }}
                onClick={() => navigate('/auth/login', { replace: true })}
              />
            </ListItem>
          </Stack>
        </Container>
      </Drawer>

      {/* Zone de contenu */}
      <Box flexGrow={1} sx={{ px: 2, pb: 3 }}>
        <Toolbar variant="h6" sx={{ px: 1, top: 0, zIndex: 1000 }}>
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={() => {}}
            sx={{ mr: 2, display: { sm: 'none', md: 'block' } as any } as React.CSSProperties}
          >
            {Home}
          </IconButton>
          <Typography variant="h6" noWrap>
            COOPECA Administration
          </Typography>
        </Toolbar>

        <Container maxWidth="lg">
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" sx={{ mb: 3 }}>
            <ol className="css-baseline" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <li className="css-baseline">
                <a href="/admin" style={{ textDecoration: 'none', color: 'text.primary' }}>
                  Accueil
                </a>
              </li>
              <li className="css-baseline">
                <a href={location.pathname} style={{ textDecoration: 'none', color: 'text.primary' }}>
                  {location.pathname.split('/').pop() || 'Tableau de bord'}
                </a>
              </li>
            </ol>
          </nav>

          {/* Contenu principal */}
          {React.Children.toArray(React.Children._allChildren || [])}
          {/* La page spécifique sera rendue ici */}
          <Box sx={{ pt: 3 }}>
            
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout;