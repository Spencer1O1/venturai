/**
 * Placeholder data for dashboard. Replace with Databricks/Dataknobs
 * Predictive Maintenance dataset when ready.
 */
export type Asset = {
  id: string;
  name: string;
  location?: string;
  riskScore: number;
  riskLoad: number;
  openWorkItemCount: number;
};

export type WorkItem = {
  id: string;
  assetId: string;
  assetName: string;
  title: string;
  riskValue: number;
  status: "open" | "closed";
  reportedAt: string;
};

export const MOCK_ASSETS: Asset[] = [
  {
    id: "ast-001",
    name: "HVAC Unit A-12",
    location: "Building 1",
    riskScore: 82,
    riskLoad: 165,
    openWorkItemCount: 2,
  },
  {
    id: "ast-002",
    name: "Pump Assembly B-3",
    location: "Building 2",
    riskScore: 64,
    riskLoad: 98,
    openWorkItemCount: 1,
  },
  {
    id: "ast-003",
    name: "Conveyor Belt C-7",
    location: "Warehouse",
    riskScore: 41,
    riskLoad: 45,
    openWorkItemCount: 1,
  },
  {
    id: "ast-004",
    name: "Generator G-1",
    location: "Building 1",
    riskScore: 18,
    riskLoad: 12,
    openWorkItemCount: 0,
  },
  {
    id: "ast-005",
    name: "Compressor D-2",
    location: "Building 2",
    riskScore: 91,
    riskLoad: 210,
    openWorkItemCount: 3,
  },
];

export const MOCK_WORK_ITEMS: WorkItem[] = [
  {
    id: "wi-1",
    assetId: "ast-001",
    assetName: "HVAC Unit A-12",
    title: "Unusual vibration",
    riskValue: 85,
    status: "open",
    reportedAt: "2025-02-26T10:00:00Z",
  },
  {
    id: "wi-2",
    assetId: "ast-001",
    assetName: "HVAC Unit A-12",
    title: "Temperature drift",
    riskValue: 80,
    status: "open",
    reportedAt: "2025-02-25T14:30:00Z",
  },
  {
    id: "wi-3",
    assetId: "ast-002",
    assetName: "Pump Assembly B-3",
    title: "Seal wear",
    riskValue: 98,
    status: "open",
    reportedAt: "2025-02-27T08:15:00Z",
  },
  {
    id: "wi-4",
    assetId: "ast-003",
    assetName: "Conveyor Belt C-7",
    title: "Belt alignment",
    riskValue: 45,
    status: "open",
    reportedAt: "2025-02-24T16:00:00Z",
  },
  {
    id: "wi-5",
    assetId: "ast-005",
    assetName: "Compressor D-2",
    title: "Oil level low",
    riskValue: 70,
    status: "open",
    reportedAt: "2025-02-27T07:00:00Z",
  },
  {
    id: "wi-6",
    assetId: "ast-005",
    assetName: "Compressor D-2",
    title: "Noise anomaly",
    riskValue: 75,
    status: "open",
    reportedAt: "2025-02-26T11:00:00Z",
  },
  {
    id: "wi-7",
    assetId: "ast-005",
    assetName: "Compressor D-2",
    title: "Pressure fluctuation",
    riskValue: 65,
    status: "open",
    reportedAt: "2025-02-25T09:00:00Z",
  },
];
