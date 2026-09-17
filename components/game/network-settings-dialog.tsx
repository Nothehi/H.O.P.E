"use client";

import { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  Server,
  Globe,
  Settings,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Radio,
  Terminal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getStoredPeerConfig,
  saveStoredPeerConfig,
  isLocalNetworkHost,
  signalingOptions,
  type UserPeerConfig,
} from "@/lib/peer-config";

interface NetworkSettingsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NetworkSettingsDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: NetworkSettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [config, setConfig] = useState<UserPeerConfig>({ mode: "auto" });
  const [currentHostname, setCurrentHostname] = useState("");
  const [activeOptions, setActiveOptions] = useState<any>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      setConfig(getStoredPeerConfig());
      setCurrentHostname(window.location.hostname);
      setActiveOptions(signalingOptions());
    }
  }, [open]);

  const handleSave = (newConfig: UserPeerConfig) => {
    saveStoredPeerConfig(newConfig);
    setConfig(newConfig);
    setActiveOptions(signalingOptions());
    toast.success("تنظیمات اتصال ذخیره شد. در حال بارگذاری مجدد...");
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const isLocal = isLocalNetworkHost(currentHostname);
  const activeHostDisplay = activeOptions.host
    ? `${activeOptions.secure ? "wss://" : "ws://"}${activeOptions.host}:${activeOptions.port || (activeOptions.secure ? 443 : 9000)}${activeOptions.path || "/"}`
    : "wss://0.peerjs.com (سرور ابری پیش‌فرض)";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        className="sm:max-w-lg border-cyan-500/40 bg-[#0A0E14]/95 backdrop-blur-2xl p-0 gap-0 overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] frame-corners"
        dir="rtl"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-cyan-900/40 to-cyan-950/60 border-b border-cyan-500/30 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="size-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black tracking-widest text-cyan-400">
                  NETWORK & SIGNALING
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-cyan-300 border-cyan-500/40 px-1.5 py-0"
                >
                  پروتکل WebRTC
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                مدیریت اتصال سرور سیگنالینگ و رفع خطای وب‌سوکت در شبکه محلی
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Current Active Server Badge */}
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/15 p-3.5 flex items-start gap-3">
            <Server className="size-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground">سرور سیگنالینگ فعال:</span>
                <Badge
                  className={
                    activeOptions.host
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-mono text-[10px]"
                      : "bg-blue-500/20 text-blue-400 border-blue-500/40 font-mono text-[10px]"
                  }
                >
                  {activeOptions.host ? "محلی (LAN)" : "ابری (Cloud)"}
                </Badge>
              </div>
              <p className="font-mono text-xs text-cyan-300 mt-1 break-all bg-black/40 px-2 py-1 rounded border border-cyan-500/20" dir="ltr">
                {activeHostDisplay}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                آدرس هاست فعلی شما: <code className="text-cyan-400 font-mono">{currentHostname || "localhost"}</code>
              </p>
            </div>
          </div>

          {/* Mode Selection Cards */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-muted-foreground block">
              انتخاب حالت شبکه و تبادل امواج:
            </label>

            {/* Option 1: Auto LAN */}
            <div
              onClick={() => handleSave({ mode: "auto" })}
              className={`rounded-lg border p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                config.mode === "auto"
                  ? "border-cyan-500 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "border-border/70 bg-card/40 hover:border-cyan-500/40"
              }`}
            >
              <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 shrink-0">
                <Wifi className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">
                    تشخیص خودکار شبکه (پیش‌نهادی)
                  </h4>
                  {config.mode === "auto" && (
                    <CheckCircle2 className="size-4 text-cyan-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  در صورت اتصال به IP محلی یا لوکال‌هاست، به طور خودکار به سرور محلی سیگنالینگ روی پورت ۹۰۰۰ متصل می‌شود؛ بدون نیاز به اینترنت و بدون فیلترینگ.
                </p>
              </div>
            </div>

            {/* Option 2: Force Local LAN */}
            <div
              onClick={() => handleSave({ mode: "lan" })}
              className={`rounded-lg border p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                config.mode === "lan"
                  ? "border-cyan-500 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "border-border/70 bg-card/40 hover:border-cyan-500/40"
              }`}
            >
              <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 shrink-0">
                <Server className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">
                    اجبار شبکه محلی (LAN Only)
                  </h4>
                  {config.mode === "lan" && (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  اتصال مستقیم به هاست دستگاه با پورت 9000 و مسیر <code className="font-mono text-emerald-400">/hope</code> (ایده‌آل برای بازی دورهمی آفلاین روی هات‌اسپات یا مودم وای‌فای).
                </p>
              </div>
            </div>

            {/* Option 3: Force Public Cloud */}
            <div
              onClick={() => handleSave({ mode: "cloud" })}
              className={`rounded-lg border p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                config.mode === "cloud"
                  ? "border-cyan-500 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "border-border/70 bg-card/40 hover:border-cyan-500/40"
              }`}
            >
              <div className="p-2 rounded bg-blue-500/10 text-blue-400 shrink-0">
                <Globe className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">
                    سرور ابری عمومی (0.peerjs.com)
                  </h4>
                  {config.mode === "cloud" && (
                    <CheckCircle2 className="size-4 text-blue-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  اتصال اینترنتی از طریق سرور عمومی رایگان PeerJS (نیازمند اینترنت آزاد و فاقد اختلال وب‌سوکت).
                </p>
              </div>
            </div>
          </div>

          {/* Quick instructions for Host */}
          <div className="rounded-lg border border-border/80 bg-black/50 p-3.5 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Terminal className="size-4 text-cyan-400" />
              <span>راهنمای راه‌اندازی سرور محلی روی دستگاه میزبان:</span>
            </div>
            <p className="leading-relaxed">
              برای بازی آفلاین روی مودم وای‌فای یا هات‌اسپات گوشی، میزبان کافیست در ترمینال یکی از دستورات زیر را اجرا کند:
            </p>
            <div className="bg-black/80 text-cyan-300 font-mono text-[11px] p-2 rounded border border-cyan-500/20" dir="ltr">
              pnpm run dev:lan &nbsp;&nbsp;# اجرای همزمان بازی و سرور محلی
            </div>
            <div className="bg-black/80 text-cyan-300 font-mono text-[11px] p-2 rounded border border-cyan-500/20" dir="ltr">
              pnpm run peer &nbsp;&nbsp;&nbsp;&nbsp;# اجرای مستقل سرور سیگنالینگ روی پورت ۹۰۰۰
            </div>
          </div>
        </div>

        <div className="bg-black/40 border-t border-border/60 px-5 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            بستن
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave({ mode: "auto" })}
            className="gap-1.5 text-xs border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/30"
          >
            <RefreshCw className="size-3.5" />
            بازنشانی به حالت خودکار
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
