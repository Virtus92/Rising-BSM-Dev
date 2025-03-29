# API Integrationstests

Diese Test-Suite enthält automatisierte Tests für die REST-API des Rising-BSM Systems.

## Übersicht

Die Tests decken folgende API-Bereiche ab:

- Authentifizierung
- Benutzer-Management
- Kunden-Management
- Benachrichtigungen
- Kontaktanfragen
- Profilmanagement

## Voraussetzungen

- Node.js 14 oder höher
- npm oder yarn
- Laufende Backend-Instanz

## Konfiguration

Die Tests können über Umgebungsvariablen konfiguriert werden:

```
API_BASE_URL=http://localhost:3000/API/v1
TEST_EMAIL=admin@example.com
TEST_PASSWORD=mein-sicheres-passwort
```

Diese Variablen können in einer `.env`-Datei im Projektroot oder direkt in der Umgebung gesetzt werden.

## Ausführung

### Alle Tests ausführen

```bash
npm test
```

### Bestimmte Test-Suite ausführen

```bash
npm test -- -t "User API"
```

### Mit detailliertem Bericht

```bash
npm test -- --verbose
```

### Tests mit Code-Coverage

```bash
npm run test:coverage
```

## Best Practices für Integrationstests

1. **Isolation**: Jeder Test sollte unabhängig laufen können und keine Abhängigkeit von anderen Tests haben.

2. **Aufräumen**: Test-Daten sollten nach Abschluss der Tests entfernt werden, um die Testumgebung sauber zu halten.

3. **Idempotenz**: Tests sollten beliebig oft ausführbar sein und immer das gleiche Ergebnis liefern.

4. **Toleranz gegenüber externen Bedingungen**: Die Tests sollten robust gegenüber Rate-Limiting, Netzwerklatenz und anderen externen Faktoren sein.

5. **Fokus auf Geschäftslogik**: Tests sollten die wichtigsten Funktionen der API überprüfen, nicht jede mögliche Randbedingung.

## Kontinuierliche Integration

Diese Tests können in CI/CD-Pipelines integriert werden, um die API-Funktionalität bei jedem Build zu überprüfen. Beispielkonfigurationen für GitHub Actions, GitLab CI oder Jenkins finden Sie im `ci`-Verzeichnis.
