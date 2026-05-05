import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Ship,
  Plane,
  Anchor,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Globe,
  Clock,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Fuel,
  Container,
  Zap,
} from "lucide-react";

const SEVERITY_COLORS: Record<number, string> = {
  9: "bg-white text-black",
  8: "bg-neutral-200 text-black",
  7: "bg-neutral-300 text-black",
  6: "bg-neutral-400 text-black",
  5: "bg-neutral-500 text-white",
  4: "bg-neutral-600 text-white",
  3: "bg-neutral-700 text-white",
};

const CATEGORY_ICONS: Record<string, typeof AlertTriangle> = {
  conflict: AlertTriangle,
  trade_war: TrendingDown,
  sanctions: Activity,
  election: Globe,
  policy: BarChart3,
  diplomacy: Globe,
  crisis: AlertTriangle,
  regulation: BarChart3,
};

type VesselItem = {
  name: string;
  type: "oil_tanker" | "cargo_ship" | "cargo_plane";
  callsign: string;
  lat: number;
  lng: number;
  heading: number;
  status: string;
  speed: number;
  cargoType: string;
  cargoWeight: number;
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  eta: Date | null;
  progress: number;
  lastUpdate: Date;
  isReal: boolean;
};

type PriceItem = {
  symbol: string;
  name: string;
  type: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  marketCap?: number;
};

function WorldMap({ vessels }: { vessels: Array<{ lat: number; lng: number; type: string; name: string; status: string; heading: number }> }) {
  const toSvg = (lat: number, lng: number) => ({
    x: ((lng + 180) / 360) * 1000,
    y: ((90 - lat) / 180) * 500,
  });

  const worldPath = "M 150,80 Q 200,60 280,75 Q 350,50 420,70 Q 480,60 550,80 Q 600,70 650,90 L 680,120 Q 700,160 670,200 Q 650,250 620,280 Q 580,300 520,310 Q 450,320 380,300 Q 320,280 280,250 Q 220,220 180,180 Q 150,140 150,80 Z M 100,150 Q 120,180 140,200 Q 130,240 110,260 Q 90,240 80,200 Q 85,170 100,150 Z M 720,100 Q 780,80 850,90 Q 900,100 920,140 Q 930,180 910,220 Q 880,250 840,260 Q 800,270 760,250 Q 730,220 720,180 Q 710,140 720,100 Z M 200,350 Q 250,330 320,340 Q 380,350 420,380 Q 400,420 350,440 Q 280,450 220,430 Q 180,400 200,350 Z M 500,350 Q 560,330 630,340 Q 680,360 700,400 Q 680,440 630,460 Q 570,470 520,450 Q 490,420 500,350 Z M 780,300 Q 830,280 880,290 Q 910,310 920,350 Q 900,390 860,400 Q 820,410 790,390 Q 770,360 780,300 Z";

  const vesselIcon = (type: string) => {
    if (type === "oil_tanker") return <circle r="4" fill="white" stroke="black" strokeWidth="1" />;
    if (type === "cargo_ship") return <rect x="-4" y="-3" width="8" height="6" fill="white" stroke="black" strokeWidth="1" />;
    return <polygon points="0,-5 4,3 -4,3" fill="white" stroke="black" strokeWidth="1" />;
  };

  return (
    <div className="w-full h-full min-h-[400px] bg-[#0a0a0a] rounded-lg overflow-hidden relative">
      <svg viewBox="0 0 1000 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {[0, 30, 60, 90, 120, 150, 180].map((lng) => {
          const x = ((lng + 180) / 360) * 1000;
          return <line key={`v${lng}`} x1={x} y1="0" x2={x} y2="500" stroke="#1a1a1a" strokeWidth="0.5" />;
        })}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = ((90 - lat) / 180) * 500;
          return <line key={`h${lat}`} x1="0" y1={y} x2="1000" y2={y} stroke="#1a1a1a" strokeWidth="0.5" />;
        })}
        <path d={worldPath} fill="#141414" stroke="#2a2a2a" strokeWidth="1" />
        {vessels.map((v, i) => {
          const pos = toSvg(v.lat, v.lng);
          return (
            <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
              {vesselIcon(v.type)}
              <line
                x1="0"
                y1="0"
                x2={Math.sin((v.heading * Math.PI) / 180) * 12}
                y2={-Math.cos((v.heading * Math.PI) / 180) * 12}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="0.8"
                strokeDasharray="2,2"
              />
            </g>
          );
        })}
        <g transform="translate(820, 20)">
          <rect x="-10" y="-15" width="180" height="80" fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="0.5" rx="4" />
          <circle cx="5" cy="5" r="4" fill="white" stroke="black" strokeWidth="1" />
          <text x="15" y="9" fill="#888" fontSize="10">Oil Tanker</text>
          <rect x="1" y="22" width="8" height="6" fill="white" stroke="black" strokeWidth="1" />
          <text x="15" y="30" fill="#888" fontSize="10">Cargo Ship</text>
          <polygon points="5,40 9,48 1,48" fill="white" stroke="black" strokeWidth="1" />
          <text x="15" y="49" fill="#888" fontSize="10">Cargo Plane</text>
        </g>
      </svg>
    </div>
  );
}

function PredictionChart({ data, color }: { data: Array<{ date: string; value: number }>; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
        <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#333" }} />
        <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#333" }} />
        <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "4px" }} labelStyle={{ color: "#888" }} />
        <Area type="monotone" dataKey="value" stroke={color} fill={`url(#grad-${color})`} strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CandlestickChart({ data }: { data: Array<{ date: string; open: number; high: number; low: number; close: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
        <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#333" }} />
        <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#333" }} domain={["auto", "auto"]} />
        <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "4px" }} labelStyle={{ color: "#888" }} formatter={(value: number) => [`$${value.toFixed(2)}`, ""]} />
        <Bar dataKey="high" fill="transparent">
          {data.map((_entry: unknown, index: number) => {
            const entry = _entry as { close: number; open: number };
            return <Cell key={index} fill={entry.close >= entry.open ? "#fff" : "#666"} fillOpacity={0.8} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MarketTable({ data }: { data: PriceItem[] }) {
  const typeIcon = (type: string) => {
    switch (type) {
      case "stock": return <BarChart3 className="w-3.5 h-3.5" />;
      case "etf": return <Activity className="w-3.5 h-3.5" />;
      case "bond": return <Anchor className="w-3.5 h-3.5" />;
      case "crypto": return <Zap className="w-3.5 h-3.5" />;
      default: return <TrendingUp className="w-3.5 h-3.5" />;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-neutral-800 hover:bg-transparent">
          <TableHead className="text-neutral-500 text-xs">Asset</TableHead>
          <TableHead className="text-neutral-500 text-xs text-right">Price</TableHead>
          <TableHead className="text-neutral-500 text-xs text-right">Change</TableHead>
          <TableHead className="text-neutral-500 text-xs text-right">%</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((asset) => (
          <TableRow key={asset.symbol} className="border-neutral-800 hover:bg-neutral-900">
            <TableCell className="py-2">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">{typeIcon(asset.type)}</span>
                <div>
                  <div className="font-mono text-sm font-medium text-white">{asset.symbol}</div>
                  <div className="text-xs text-neutral-500">{asset.name}</div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right font-mono text-sm text-white">
              ${asset.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </TableCell>
            <TableCell className={`text-right font-mono text-sm ${asset.change >= 0 ? "text-white" : "text-neutral-400"}`}>
              {asset.change >= 0 ? "+" : ""}
              {asset.change.toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
              <div className={`inline-flex items-center gap-1 font-mono text-xs ${asset.changePercent >= 0 ? "text-white" : "text-neutral-400"}`}>
                {asset.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(asset.changePercent).toFixed(2)}%
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAssetType, setSelectedAssetType] = useState<string>("all");

  const { data: vessels } = trpc.vessel.live.useQuery(undefined, { refetchInterval: 5000 });
  const { data: politicalEvents } = trpc.political.list.useQuery();
  const { data: severityStats } = trpc.political.severityStats.useQuery();
  const { data: marketPrices } = trpc.market.livePrices.useQuery(undefined, { refetchInterval: 30000 });
  const { data: outlook } = trpc.prediction.marketOutlook.useQuery();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredAssets = marketPrices
    ? selectedAssetType === "all"
      ? marketPrices
      : marketPrices.filter((a: PriceItem) => a.type === selectedAssetType)
    : [];

  const generatePredictionData = useCallback((basePrice: number, direction: "up" | "down" | "neutral", days: number) => {
    const data: Array<{ date: string; value: number }> = [];
    let price = basePrice;
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const change = direction === "up"
        ? (Math.random() - 0.3) * basePrice * 0.02
        : direction === "down"
          ? (Math.random() - 0.7) * basePrice * 0.02
          : (Math.random() - 0.5) * basePrice * 0.01;
      price += change;
      data.push({ date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: Math.round(price * 100) / 100 });
    }
    return data;
  }, []);

  const generateOhlcData = useCallback((days: number) => {
    const data: Array<{ date: string; open: number; high: number; low: number; close: number }> = [];
    let price = 100;
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const change = (Math.random() - 0.48) * 3;
      price += change;
      const open = price - (Math.random() - 0.5) * 2;
      const close = price;
      const high = Math.max(open, close) + Math.random() * 1.5;
      const low = Math.min(open, close) - Math.random() * 1.5;
      data.push({ date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), open: Math.round(open * 100) / 100, high: Math.round(high * 100) / 100, low: Math.round(low * 100) / 100, close: Math.round(close * 100) / 100 });
    }
    return data;
  }, []);

  const chartData = generateOhlcData(30);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-neutral-800 bg-[#0a0a0a] px-6 py-4">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <Globe className="w-6 h-6 text-white" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">GEOPOLITICAL LOGISTICS DASHBOARD</h1>
              <p className="text-xs text-neutral-500">Real-time vessel tracking & market intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{currentTime.toUTCString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs text-neutral-400">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-[#0a0a0a] border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Vessels Tracked</p>
                  <p className="text-2xl font-mono font-semibold text-white">{vessels?.length ?? 0}</p>
                </div>
                <Ship className="w-5 h-5 text-neutral-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Oil Tankers</p>
                  <p className="text-2xl font-mono font-semibold text-white">{vessels?.filter((v: VesselItem) => v.type === "oil_tanker").length ?? 0}</p>
                </div>
                <Fuel className="w-5 h-5 text-neutral-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Cargo Ships</p>
                  <p className="text-2xl font-mono font-semibold text-white">{vessels?.filter((v: VesselItem) => v.type === "cargo_ship").length ?? 0}</p>
                </div>
                <Container className="w-5 h-5 text-neutral-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Cargo Planes</p>
                  <p className="text-2xl font-mono font-semibold text-white">{vessels?.filter((v: VesselItem) => v.type === "cargo_plane").length ?? 0}</p>
                </div>
                <Plane className="w-5 h-5 text-neutral-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Active Events</p>
                  <p className="text-2xl font-mono font-semibold text-white">{politicalEvents?.length ?? 0}</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-neutral-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Geopolitical Risk</p>
                  <p className="text-2xl font-mono font-semibold text-white">
                    {severityStats ? `${(Object.values(severityStats.byCategory).reduce((a: number, c: { avgSeverity: number }) => a + c.avgSeverity, 0) / Math.max(Object.keys(severityStats.byCategory).length, 1)).toFixed(1)}/10` : "--"}
                  </p>
                </div>
                <Activity className="w-5 h-5 text-neutral-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-[#0a0a0a] border-neutral-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  GLOBAL VESSEL TRACKING
                </CardTitle>
                <div className="flex items-center gap-2">
                  {["oil_tanker", "cargo_ship", "cargo_plane"].map((type) => (
                    <Badge key={type} variant="outline" className="border-neutral-700 text-neutral-400 text-xs capitalize">
                      {type.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <WorldMap vessels={vessels ?? []} />
            </CardContent>
          </Card>

          <Card className="bg-[#0a0a0a] border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                POLITICAL EVENTS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] scrollbar-thin">
                <div className="px-4 pb-4 space-y-3">
                  {politicalEvents?.map((event) => {
                    const Icon = CATEGORY_ICONS[event.category] || AlertTriangle;
                    return (
                      <div key={event.id} className="p-3 rounded-md bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors">
                        <div className="flex items-start gap-2">
                          <Icon className="w-3.5 h-3.5 text-neutral-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white leading-tight">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge className={`text-[10px] px-1.5 py-0 ${SEVERITY_COLORS[event.severity] || "bg-neutral-600 text-white"}`}>
                                {event.severity}/10
                              </Badge>
                              <span className="text-[10px] text-neutral-500 uppercase">{event.category.replace("_", " ")}</span>
                              <span className="text-[10px] text-neutral-600">{event.region}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Market Data & Predictions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#0a0a0a] border-neutral-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  MARKET PRICES
                </CardTitle>
                <Tabs value={selectedAssetType} onValueChange={setSelectedAssetType}>
                  <TabsList className="bg-neutral-900 h-7">
                    <TabsTrigger value="all" className="text-xs px-2 py-0.5 data-[state=active]:bg-white data-[state=active]:text-black">All</TabsTrigger>
                    <TabsTrigger value="stock" className="text-xs px-2 py-0.5 data-[state=active]:bg-white data-[state=active]:text-black">Stocks</TabsTrigger>
                    <TabsTrigger value="etf" className="text-xs px-2 py-0.5 data-[state=active]:bg-white data-[state=active]:text-black">ETFs</TabsTrigger>
                    <TabsTrigger value="bond" className="text-xs px-2 py-0.5 data-[state=active]:bg-white data-[state=active]:text-black">Bonds</TabsTrigger>
                    <TabsTrigger value="crypto" className="text-xs px-2 py-0.5 data-[state=active]:bg-white data-[state=active]:text-black">Crypto</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] scrollbar-thin">
                <MarketTable data={filteredAssets as PriceItem[]} />
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-[#0a0a0a] border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <Activity className="w-4 h-4" />
                MARKET OUTLOOK
              </CardTitle>
            </CardHeader>
            <CardContent>
              {outlook && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-500">Current Outlook</p>
                      <p className="text-xl font-semibold text-white">{outlook.outlook}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">Risk Level</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className={`w-2 h-4 rounded-sm ${i < outlook.riskLevel ? "bg-white" : "bg-neutral-800"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{outlook.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1.5">Key Risks</p>
                      <div className="space-y-1">
                        {outlook.keyRisks.map((risk: string, i: number) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <ArrowDownRight className="w-3 h-3 text-neutral-500" />
                            <span className="text-xs text-neutral-300">{risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1.5">Opportunities</p>
                      <div className="space-y-1">
                        {outlook.opportunities.map((opp: string, i: number) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <ArrowUpRight className="w-3 h-3 text-neutral-500" />
                            <span className="text-xs text-neutral-300">{opp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-neutral-800">
                    <p className="text-xs text-neutral-500 mb-1">Recommendation</p>
                    <p className="text-xs text-neutral-300">{outlook.recommendation}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Prediction Charts */}
        <Card className="bg-[#0a0a0a] border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              PREDICTIVE ANALYTICS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Energy Sector (XLE)", symbol: "XLE", dir: "up" as const, basePrice: 96 },
                { label: "Oil Fund (USO)", symbol: "USO", dir: "up" as const, basePrice: 77 },
                { label: "Treasury (TLT)", symbol: "TLT", dir: "down" as const, basePrice: 92 },
                { label: "Bitcoin (BTC)", symbol: "BTC", dir: "neutral" as const, basePrice: 67500 },
              ].map((item) => (
                <div key={item.symbol} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.dir === "up" && <ArrowUpRight className="w-3 h-3 text-white" />}
                      {item.dir === "down" && <ArrowDownRight className="w-3 h-3 text-neutral-500" />}
                      {item.dir === "neutral" && <Minus className="w-3 h-3 text-neutral-600" />}
                      <span className="text-xs font-mono text-neutral-500">
                        {(Math.random() * 10 + 55).toFixed(0)}% conf
                      </span>
                    </div>
                  </div>
                  <PredictionChart data={generatePredictionData(item.basePrice, item.dir, 30)} color={item.dir === "up" ? "#fff" : item.dir === "down" ? "#666" : "#888"} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technical Chart */}
        <Card className="bg-[#0a0a0a] border-neutral-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                TECHNICAL ANALYSIS — SAMPLE OHLC
              </CardTitle>
              <Badge variant="outline" className="border-neutral-700 text-neutral-400 text-xs">30D</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CandlestickChart data={chartData} />
          </CardContent>
        </Card>

        {/* Vessel Status Table */}
        <Card className="bg-[#0a0a0a] border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <Ship className="w-4 h-4" />
              VESSEL STATUS DETAILS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px] scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800 hover:bg-transparent">
                    <TableHead className="text-neutral-500 text-xs">Vessel</TableHead>
                    <TableHead className="text-neutral-500 text-xs">Type</TableHead>
                    <TableHead className="text-neutral-500 text-xs">Status</TableHead>
                    <TableHead className="text-neutral-500 text-xs">Cargo</TableHead>
                    <TableHead className="text-neutral-500 text-xs text-right">Speed</TableHead>
                    <TableHead className="text-neutral-500 text-xs text-right">Heading</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vessels?.map((v: VesselItem, i: number) => (
                    <TableRow key={i} className="border-neutral-800 hover:bg-neutral-900">
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          {v.type === "oil_tanker" && <Fuel className="w-3.5 h-3.5 text-neutral-500" />}
                          {v.type === "cargo_ship" && <Container className="w-3.5 h-3.5 text-neutral-500" />}
                          {v.type === "cargo_plane" && <Plane className="w-3.5 h-3.5 text-neutral-500" />}
                          <span className="font-mono text-xs text-white">{v.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-neutral-400 capitalize">{v.type.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${v.status === "en_route" ? "border-neutral-600 text-neutral-300" : v.status === "at_port" ? "border-white text-white" : "border-neutral-700 text-neutral-500"}`}>
                          {v.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-neutral-400">{v.cargoType}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-neutral-300">
                        {v.speed} {v.type === "cargo_plane" ? "km/h" : "kts"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-neutral-300">
                        {Math.round(v.heading)}&deg;
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
