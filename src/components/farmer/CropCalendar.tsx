import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Leaf, Sun, CloudRain, Snowflake, Sprout, Wheat } from "lucide-react";
import { motion } from "framer-motion";

interface CropSeason {
  id: string;
  name: string;
  name_ne: string;
  plantingStart: number; // month (1-12)
  plantingEnd: number;
  harvestStart: number;
  harvestEnd: number;
  season: "monsoon" | "winter" | "summer" | "all";
  icon: string;
  tips_ne: string;
}

const cropCalendarData: CropSeason[] = [
  {
    id: "rice",
    name: "Rice",
    name_ne: "धान",
    plantingStart: 6,
    plantingEnd: 7,
    harvestStart: 10,
    harvestEnd: 11,
    season: "monsoon",
    icon: "🌾",
    tips_ne: "जेठ-असारमा रोप्नुहोस्, कात्तिक-मंसिरमा काट्नुहोस्"
  },
  {
    id: "wheat",
    name: "Wheat",
    name_ne: "गहुँ",
    plantingStart: 11,
    plantingEnd: 12,
    harvestStart: 4,
    harvestEnd: 5,
    season: "winter",
    icon: "🌾",
    tips_ne: "कात्तिक-मंसिरमा रोप्नुहोस्, चैत-वैशाखमा काट्नुहोस्"
  },
  {
    id: "maize",
    name: "Maize",
    name_ne: "मकै",
    plantingStart: 3,
    plantingEnd: 4,
    harvestStart: 7,
    harvestEnd: 8,
    season: "summer",
    icon: "🌽",
    tips_ne: "फागुन-चैतमा रोप्नुहोस्, असार-साउनमा काट्नुहोस्"
  },
  {
    id: "potato",
    name: "Potato",
    name_ne: "आलु",
    plantingStart: 10,
    plantingEnd: 11,
    harvestStart: 2,
    harvestEnd: 3,
    season: "winter",
    icon: "🥔",
    tips_ne: "असोज-कात्तिकमा रोप्नुहोस्, माघ-फागुनमा खन्नुहोस्"
  },
  {
    id: "tomato",
    name: "Tomato",
    name_ne: "गोलभेडा",
    plantingStart: 9,
    plantingEnd: 10,
    harvestStart: 12,
    harvestEnd: 3,
    season: "winter",
    icon: "🍅",
    tips_ne: "भदौ-असोजमा बिउ राख्नुहोस्, पुस-चैतसम्म फल्छ"
  },
  {
    id: "cauliflower",
    name: "Cauliflower",
    name_ne: "काउली",
    plantingStart: 8,
    plantingEnd: 9,
    harvestStart: 11,
    harvestEnd: 1,
    season: "winter",
    icon: "🥬",
    tips_ne: "साउन-भदौमा बिउ राख्नुहोस्, कात्तिक-माघमा काट्नुहोस्"
  },
  {
    id: "mustard",
    name: "Mustard",
    name_ne: "तोरी",
    plantingStart: 10,
    plantingEnd: 11,
    harvestStart: 2,
    harvestEnd: 3,
    season: "winter",
    icon: "🌻",
    tips_ne: "असोज-कात्तिकमा छर्नुहोस्, माघ-फागुनमा काट्नुहोस्"
  },
  {
    id: "sugarcane",
    name: "Sugarcane",
    name_ne: "उखु",
    plantingStart: 2,
    plantingEnd: 3,
    harvestStart: 12,
    harvestEnd: 2,
    season: "all",
    icon: "🎋",
    tips_ne: "माघ-फागुनमा रोप्नुहोस्, १२-१४ महिनामा काट्नुहोस्"
  },
  {
    id: "lentils",
    name: "Lentils",
    name_ne: "मसुरो",
    plantingStart: 10,
    plantingEnd: 11,
    harvestStart: 2,
    harvestEnd: 3,
    season: "winter",
    icon: "🫘",
    tips_ne: "असोज-कात्तिकमा छर्नुहोस्, माघ-फागुनमा काट्नुहोस्"
  },
  {
    id: "millet",
    name: "Finger Millet",
    name_ne: "कोदो",
    plantingStart: 5,
    plantingEnd: 6,
    harvestStart: 10,
    harvestEnd: 11,
    season: "monsoon",
    icon: "🌾",
    tips_ne: "जेठ-असारमा रोप्नुहोस्, असोज-कात्तिकमा काट्नुहोस्"
  },
  {
    id: "chilli",
    name: "Chilli",
    name_ne: "खुर्सानी",
    plantingStart: 2,
    plantingEnd: 3,
    harvestStart: 6,
    harvestEnd: 10,
    season: "summer",
    icon: "🌶️",
    tips_ne: "माघ-फागुनमा बिउ राख्नुहोस्, असार-असोजसम्म टिप्नुहोस्"
  },
  {
    id: "onion",
    name: "Onion",
    name_ne: "प्याज",
    plantingStart: 9,
    plantingEnd: 10,
    harvestStart: 2,
    harvestEnd: 4,
    season: "winter",
    icon: "🧅",
    tips_ne: "भदौ-असोजमा रोप्नुहोस्, माघ-चैतमा उखेल्नुहोस्"
  }
];

const nepaliMonths = [
  "बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
  "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"
];

const englishMonths = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const CropCalendar = () => {
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case "monsoon": return <CloudRain className="w-4 h-4" />;
      case "winter": return <Snowflake className="w-4 h-4" />;
      case "summer": return <Sun className="w-4 h-4" />;
      default: return <Leaf className="w-4 h-4" />;
    }
  };

  const getSeasonLabel = (season: string) => {
    switch (season) {
      case "monsoon": return "वर्षा";
      case "winter": return "हिउँद";
      case "summer": return "गर्मी";
      default: return "सबै";
    }
  };

  const getSeasonColor = (season: string) => {
    switch (season) {
      case "monsoon": return "bg-blue-500";
      case "winter": return "bg-cyan-500";
      case "summer": return "bg-orange-500";
      default: return "bg-green-500";
    }
  };

  const isInRange = (month: number, start: number, end: number) => {
    if (start <= end) {
      return month >= start && month <= end;
    } else {
      // Wraps around year (e.g., Nov-Feb)
      return month >= start || month <= end;
    }
  };

  const getCropsForMonth = (month: number) => {
    return cropCalendarData.filter(crop => {
      const isPlanting = isInRange(month, crop.plantingStart, crop.plantingEnd);
      const isHarvesting = isInRange(month, crop.harvestStart, crop.harvestEnd);
      return isPlanting || isHarvesting;
    });
  };

  const filteredCrops = selectedSeason === "all" 
    ? cropCalendarData 
    : cropCalendarData.filter(c => c.season === selectedSeason);

  const getCurrentActivities = () => {
    const activities: { crop: CropSeason; type: "planting" | "harvesting" }[] = [];
    
    cropCalendarData.forEach(crop => {
      if (isInRange(currentMonth, crop.plantingStart, crop.plantingEnd)) {
        activities.push({ crop, type: "planting" });
      }
      if (isInRange(currentMonth, crop.harvestStart, crop.harvestEnd)) {
        activities.push({ crop, type: "harvesting" });
      }
    });
    
    return activities;
  };

  const currentActivities = getCurrentActivities();

  return (
    <div className="space-y-6">
      {/* Header with Current Month Activities */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            बाली पात्रो - {nepaliMonths[currentMonth - 1]}
          </CardTitle>
          <CardDescription>
            यो महिना के गर्ने? हाल {englishMonths[currentMonth - 1]} महिना चलिरहेको छ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentActivities.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {currentActivities.map(({ crop, type }, idx) => (
                <motion.div
                  key={`${crop.id}-${type}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    type === "planting" 
                      ? "bg-green-500/10 border border-green-500/20" 
                      : "bg-amber-500/10 border border-amber-500/20"
                  }`}
                >
                  <span className="text-2xl">{crop.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{crop.name_ne}</span>
                      <Badge variant={type === "planting" ? "default" : "secondary"} className="text-xs">
                        {type === "planting" ? (
                          <><Sprout className="w-3 h-3 mr-1" /> रोप्ने</>
                        ) : (
                          <><Wheat className="w-3 h-3 mr-1" /> काट्ने</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{crop.tips_ne}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              यो महिना कुनै विशेष काम छैन
            </p>
          )}
        </CardContent>
      </Card>

      {/* Season Filter */}
      <div className="flex flex-wrap gap-2">
        {["all", "monsoon", "winter", "summer"].map((season) => (
          <Button
            key={season}
            variant={selectedSeason === season ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeason(season)}
            className="gap-2"
          >
            {getSeasonIcon(season)}
            {getSeasonLabel(season)}
          </Button>
        ))}
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            वार्षिक बाली पात्रो
          </CardTitle>
          <CardDescription>
            🟢 रोप्ने समय &nbsp; 🟡 काट्ने समय
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">बाली</th>
                  {nepaliMonths.map((month, idx) => (
                    <th 
                      key={month} 
                      className={`text-center py-3 px-1 font-medium text-xs ${
                        idx + 1 === currentMonth ? "bg-primary/10 rounded" : ""
                      }`}
                    >
                      {month.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCrops.map((crop) => (
                  <tr key={crop.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{crop.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{crop.name_ne}</p>
                          <p className="text-xs text-muted-foreground">{crop.name}</p>
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 12 }, (_, idx) => {
                      const month = idx + 1;
                      const isPlanting = isInRange(month, crop.plantingStart, crop.plantingEnd);
                      const isHarvesting = isInRange(month, crop.harvestStart, crop.harvestEnd);
                      const isCurrent = month === currentMonth;
                      
                      return (
                        <td 
                          key={month} 
                          className={`text-center p-1 ${isCurrent ? "bg-primary/5" : ""}`}
                        >
                          {isPlanting && isHarvesting ? (
                            <div className="w-6 h-6 mx-auto rounded bg-gradient-to-r from-green-500 to-amber-500 flex items-center justify-center">
                              <span className="text-xs">🌱</span>
                            </div>
                          ) : isPlanting ? (
                            <div className="w-6 h-6 mx-auto rounded bg-green-500/80 flex items-center justify-center">
                              <Sprout className="w-3 h-3 text-white" />
                            </div>
                          ) : isHarvesting ? (
                            <div className="w-6 h-6 mx-auto rounded bg-amber-500/80 flex items-center justify-center">
                              <Wheat className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>बाली रोप्ने सुझावहरू</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCrops.slice(0, 6).map((crop) => (
              <div 
                key={crop.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <span className="text-2xl">{crop.icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{crop.name_ne}</span>
                    <Badge variant="outline" className={`text-xs ${getSeasonColor(crop.season)} text-white border-0`}>
                      {getSeasonLabel(crop.season)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{crop.tips_ne}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CropCalendar;