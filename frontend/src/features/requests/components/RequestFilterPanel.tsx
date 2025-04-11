import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { RequestFilterParamsDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { Search, Filter, X } from 'lucide-react';

interface RequestFilterPanelProps {
  filters: RequestFilterParamsDto;
  onFilterChange: (filters: Partial<RequestFilterParamsDto>) => void;
  onReset: () => void;
}

/**
 * Komponente zur Filterung von Kontaktanfragen
 */
export const RequestFilterPanel: React.FC<RequestFilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Nichts tun, da die Filter bereits beim Ändern angewendet werden
  };

  // Properly type the checkbox change handlers
  const handleUnassignedChange = (checked: boolean | 'indeterminate') => {
    onFilterChange({ unassigned: checked === true });
  };

  const handleNotConvertedChange = (checked: boolean | 'indeterminate') => {
    onFilterChange({ notConverted: checked === true });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Suchfeld und Filter-Toggle */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Suche nach Name, E-Mail oder Nachricht..."
                className="pl-8"
                value={filters.search || ''}
                onChange={(e) => onFilterChange({ search: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter {expanded ? 'ausblenden' : 'anzeigen'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
              className="flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
          </div>

          {/* Erweiterte Filter */}
          {expanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => onFilterChange({ status: value ? (value as RequestStatus) : undefined })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Alle Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Status</SelectItem>
                    <SelectItem value={RequestStatus.NEW}>Neu</SelectItem>
                    <SelectItem value={RequestStatus.IN_PROGRESS}>In Bearbeitung</SelectItem>
                    <SelectItem value={RequestStatus.COMPLETED}>Abgeschlossen</SelectItem>
                    <SelectItem value={RequestStatus.CANCELLED}>Abgebrochen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service Filter */}
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select
                  value={filters.service || ''}
                  onValueChange={(value) => onFilterChange({ service: value || undefined })}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Alle Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Services</SelectItem>
                    <SelectItem value="Website-Entwicklung">Website-Entwicklung</SelectItem>
                    <SelectItem value="SEO-Optimierung">SEO-Optimierung</SelectItem>
                    <SelectItem value="Online-Marketing">Online-Marketing</SelectItem>
                    <SelectItem value="App-Entwicklung">App-Entwicklung</SelectItem>
                    <SelectItem value="IT-Beratung">IT-Beratung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sortierung */}
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sortieren nach</Label>
                <Select
                  value={filters.sortBy || 'createdAt'}
                  onValueChange={(value) => onFilterChange({ sortBy: value })}
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue placeholder="Sortieren nach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Erstellungsdatum</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sortierrichtung */}
              <div className="space-y-2">
                <Label htmlFor="sortDirection">Reihenfolge</Label>
                <Select
                  value={filters.sortDirection || 'desc'}
                  onValueChange={(value) => 
                    onFilterChange({ sortDirection: value as 'asc' | 'desc' })}
                >
                  <SelectTrigger id="sortDirection">
                    <SelectValue placeholder="Reihenfolge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Neueste zuerst</SelectItem>
                    <SelectItem value="asc">Älteste zuerst</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Zusätzliche Filteroptionen */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unassigned"
                  checked={filters.unassigned || false}
                  onCheckedChange={handleUnassignedChange}
                />
                <Label htmlFor="unassigned">Nicht zugewiesen</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notConverted"
                  checked={filters.notConverted || false}
                  onCheckedChange={handleNotConvertedChange}
                />
                <Label htmlFor="notConverted">Nicht konvertiert</Label>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
