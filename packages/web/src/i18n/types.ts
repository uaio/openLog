export interface Locale {
  // App tabs
  tabs: {
    console: string;
    network: string;
    storage: string;
    perf: string;
    health: string;
    analysis: string;
    settings: string;
    mock: string;
    dom: string;
  };
  // Common
  common: {
    loading: string;
    noData: string;
    refresh: string;
    export: string;
    clear: string;
    delete: string;
    confirm: string;
    cancel: string;
    success: string;
    error: string;
    warning: string;
    selectDevice: string;
    online: string;
    offline: string;
    connected: string;
    connecting: string;
    disconnected: string;
    operationFailed: string;
    unknownError: string;
    all: string;
  };
  // Device list
  deviceList: {
    title: string;
    empty: string;
  };
  // Log panel
  logPanel: {
    title: string;
    historicalLoaded: string;
    clearHistory: string;
    clearHistoryConfirm: string;
    clearHistoryFailed: string;
    refreshPage: string;
    analysis: string;
    all: string;
    search: string;
    jsPlaceholder: string;
    jsPlaceholderNoDevice: string;
    clearing: string;
    run: string;
    aiLogAnalysis: string;
  };
  // Network panel
  networkPanel: {
    title: string;
    status: string;
    duration: string;
    type: string;
    allMethods: string;
    allStatus: string;
    errorOnly: string;
    searchPlaceholder: string;
    headers: string;
    requestBody: string;
    responseBody: string;
  };
  // Storage panel
  storagePanel: {
    title: string;
    totalSize: string;
    records: string;
    clearConfirm: string;
  };
  // Settings
  settings: {
    title: string;
    deviceInfo: string;
    display: string;
    showTimestamp: string;
    autoScroll: string;
  };
  // Health panel
  healthPanel: {
    title: string;
    autoRefresh: string;
    errorsInMinutes: string;
    good: string;
    warning: string;
    critical: string;
    checking: string;
    selectDevice: string;
    clickRefresh: string;
    updatedAt: string;
    recentErrors: string;
    longTaskDuration: string;
    memoryUsage: string;
    uncompressedResources: string;
    healthy: string;
    count: string;
  };
  // Performance panel
  perfPanel: {
    ratingGood: string;
    ratingNeedsImprovement: string;
    ratingPoor: string;
  };
  // Mock panel
  mockPanel: {
    title: string;
    addRule: string;
    clearAll: string;
    clearAllConfirm: string;
    activeRules: string;
  };
  // DOM panel
  domPanel: {
    title: string;
    waitingHint: string;
  };
  // PerfRun panel
  perfRunPanel: {
    title: string;
    start: string;
    stop: string;
    history: string;
    startFailed: string;
    stopFailed: string;
    running: string;
  };
}
