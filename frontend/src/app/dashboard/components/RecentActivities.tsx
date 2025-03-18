const RecentActivities = () => {
    const activities = [
      {
        id: 1,
        type: 'request',
        title: 'Neue Anfrage',
        description: 'Facility Management für Bürogebäude',
        user: 'Max Mustermann',
        time: 'Vor 30 Minuten',
      },
      {
        id: 2,
        type: 'appointment',
        title: 'Termin bestätigt',
        description: 'Beratungsgespräch für Winterdienst',
        user: 'Julia Schneider',
        time: 'Vor 2 Stunden',
      },
      {
        id: 3,
        type: 'project',
        title: 'Projekt abgeschlossen',
        description: 'Umzug Firmensitz Linz',
        user: 'Thomas Huber',
        time: 'Vor 5 Stunden',
      },
      {
        id: 4,
        type: 'customer',
        title: 'Neuer Kunde',
        description: 'Immobilienverwaltung Haus & Grund',
        user: 'Laura Müller',
        time: 'Vor 1 Tag',
      },
      {
        id: 5,
        type: 'invoice',
        title: 'Rechnung beglichen',
        description: 'Winterdienst Dezember 2023',
        user: 'System',
        time: 'Vor 1 Tag',
      },
    ];
    
    // Function to get icon based on activity type
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'request':
          return (
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          );
        case 'invoice':
          return (
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
              <svg className="h-5 w-5 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          );
        default:
          return (
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          );
      }
    };
  
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aktuelle Aktivitäten</h3>
          <button className="text-sm text-green-600 dark:text-green-500 hover:underline">
            Alle anzeigen
          </button>
        </div>
        
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {activity.description}
                </p>
                <div className="flex items-center mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {activity.user}
                  </p>
                  <span className="mx-2 text-gray-400 dark:text-gray-600">•</span>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {activity.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default RecentActivities;