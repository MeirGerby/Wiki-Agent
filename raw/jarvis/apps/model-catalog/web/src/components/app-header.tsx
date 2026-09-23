import { isRoleAtLeast, type Geography } from '@jarvis/model-catalog-contract';
import { Button } from '@jarvis/ui/components/ui/button';
import { Input } from '@jarvis/ui/components/ui/input';
import { Link } from '@tanstack/react-router';
import infoCircleIcon from '../assets/info-circle.svg';
import lockIcon from '../assets/lock.svg';
import searchIcon from '../assets/search.svg';
import { useAuth } from '../contexts/auth-context';
import { ROLE_LABELS } from '../utils/roles';
import { GeographyFilter } from './geography-filter';
import { Icon } from './icon';

type AppHeaderProps = {
  query: string;
  onQueryChange: (query: string) => void;
  geographies: readonly Geography[];
  geography?: string;
  onGeographyChange: (geography: string | undefined) => void;
};

const SEARCH_PLACEHOLDER = 'חפש אובייקט/מודל...';

export function AppHeader({
  query,
  onQueryChange,
  geographies,
  geography,
  onGeographyChange,
}: AppHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 bg-card p-4">
      <div className="flex items-center gap-4">
        <div className="relative w-[340px]">
          <Icon
            src={searchIcon}
            className="pointer-events-none absolute inset-y-0 right-3 my-auto"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            aria-label={SEARCH_PLACEHOLDER}
            className="h-8 pr-9 text-sm shadow-none"
          />
        </div>

        <GeographyFilter
          geographies={geographies}
          value={geography}
          onChange={onGeographyChange}
        />
      </div>

      <div className="flex items-center gap-4">
        {user && isRoleAtLeast(user.role, 'admin') && (
          <Button variant="outline" size="icon-sm" asChild>
            <Link to="/permissions">
              <Icon src={lockIcon} label="ניהול הרשאות" />
            </Link>
          </Button>
        )}

        <div className="flex flex-col items-start">
          <p className="text-sm font-bold">{user?.fullName}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Icon src={lockIcon} size={12} />
            {user ? ROLE_LABELS[user.role] : ''}
            <Icon src={infoCircleIcon} size={12} />
          </p>
        </div>
      </div>
    </header>
  );
}
