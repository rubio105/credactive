import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Award, Target, Clock, Brain, BarChart3, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  analytics: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    recentScores: number[];
    timeSpent: number;
    weakTopics: string[];
    strongTopics: string[];
  } | null;
  readinessScore: number;
}

interface PerformanceTrend {
  date: string;
  score: number;
  category: string;
}

export default function AnalyticsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [trendDays, setTrendDays] = useState<number>(30);
  const [, navigate] = useLocation();

  // Fetch overall analytics
  const { data: overallAnalytics, isLoading: loadingOverall, error: overallError } = useQuery<CategoryAnalytics[]>({
    queryKey: ["/api/analytics/overall"],
  });

  // Fetch performance trend
  const { data: performanceTrend, isLoading: loadingTrend, error: trendError } = useQuery<PerformanceTrend[]>({
    queryKey: [`/api/analytics/performance-trend?days=${trendDays}`],
  });

  // Fetch category-specific analytics
  const { data: categoryAnalytics, isLoading: loadingCategory, error: categoryError } = useQuery<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    recentScores: number[];
    timeSpent: number;
    weakTopics: string[];
    strongTopics: string[];
    readinessScore: number;
    benchmark: {
      averageScore: number;
      totalAttempts: number;
    };
  }>({
    queryKey: [`/api/analytics/category/${selectedCategory}`],
    enabled: selectedCategory !== "all",
  });

  // Calculate overall stats
  const totalAttempts = overallAnalytics?.reduce((sum, cat) => sum + (cat.analytics?.totalAttempts || 0), 0) || 0;
  const averageReadiness = overallAnalytics?.length 
    ? Math.round(overallAnalytics.reduce((sum, cat) => sum + cat.readinessScore, 0) / overallAnalytics.length)
    : 0;
  const totalTimeSpent = overallAnalytics?.reduce((sum, cat) => sum + (cat.analytics?.timeSpent || 0), 0) || 0;

  // Get readiness color
  const getReadinessColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return "Ready";
    if (score >= 60) return "Preparing";
    return "Needs Work";
  };

  // Format time (minutes to hours/minutes)
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (loadingOverall) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (overallError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="text-lg font-semibold">Failed to load analytics</p>
              <p className="text-sm text-muted-foreground mt-2">
                {overallError instanceof Error ? overallError.message : "An error occurred"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-4"
        data-testid="button-back-to-home"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Torna alla Home
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-analytics-title">Performance Analytics</h1>
          <p className="text-muted-foreground">Track your progress and readiness for certifications</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-attempts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-attempts">{totalAttempts}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-readiness">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Readiness</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getReadinessColor(averageReadiness)}`} data-testid="text-avg-readiness">
              {averageReadiness}%
            </div>
            <p className="text-xs text-muted-foreground">{getReadinessLabel(averageReadiness)}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-time">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-time">{formatTime(totalTimeSpent)}</div>
            <p className="text-xs text-muted-foreground">Total practice time</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-categories">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-categories">
              {overallAnalytics?.filter(c => c.analytics && c.analytics.totalAttempts > 0).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Categories in progress</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">By Category</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card data-testid="card-readiness-overview">
            <CardHeader>
              <CardTitle>Certification Readiness</CardTitle>
              <CardDescription>Your readiness score across all certification categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overallAnalytics?.filter(cat => cat.analytics && cat.analytics.totalAttempts > 0).map((cat) => (
                  <div key={cat.categoryId} className="space-y-2" data-testid={`readiness-${cat.categoryId}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat.categoryName}</span>
                        <Badge variant={cat.readinessScore >= 80 ? "default" : "secondary"}>
                          {getReadinessLabel(cat.readinessScore)}
                        </Badge>
                      </div>
                      <span className={`text-lg font-bold ${getReadinessColor(cat.readinessScore)}`}>
                        {cat.readinessScore}%
                      </span>
                    </div>
                    <Progress value={cat.readinessScore} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{cat.analytics?.totalAttempts || 0} attempts</span>
                      <span>Avg: {(cat.analytics?.averageScore || 0).toFixed(1)}%</span>
                      <span>Best: {cat.analytics?.bestScore || 0}%</span>
                    </div>
                  </div>
                ))}
                {(!overallAnalytics || overallAnalytics.filter(c => c.analytics && c.analytics.totalAttempts > 0).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No quiz attempts yet. Start practicing to see your readiness scores!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart for Multi-Category Comparison */}
          {overallAnalytics && overallAnalytics.filter(c => c.analytics && c.analytics.totalAttempts > 0).length > 2 && (
            <Card data-testid="card-radar-comparison">
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Your performance across different certification areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={overallAnalytics.filter(c => c.analytics && c.analytics.totalAttempts > 0).map(cat => ({
                    category: cat.categoryName.length > 20 ? cat.categoryName.substring(0, 20) + "..." : cat.categoryName,
                    score: cat.analytics?.averageScore || 0,
                    readiness: cat.readinessScore,
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Average Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Readiness" dataKey="readiness" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[300px]" data-testid="select-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {overallAnalytics?.filter(c => c.analytics && c.analytics.totalAttempts > 0).map((cat) => (
                  <SelectItem key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory !== "all" && categoryError && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <p>Failed to load category analytics</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {categoryError instanceof Error ? categoryError.message : "An error occurred"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedCategory !== "all" && !categoryError && categoryAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card data-testid="card-category-performance">
                <CardHeader>
                  <CardTitle>Performance Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Readiness Score</span>
                    <span className={`text-2xl font-bold ${getReadinessColor(categoryAnalytics.readinessScore)}`}>
                      {categoryAnalytics.readinessScore}%
                    </span>
                  </div>
                  <Progress value={categoryAnalytics.readinessScore} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Attempts</p>
                      <p className="text-xl font-bold">{categoryAnalytics.totalAttempts || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time Spent</p>
                      <p className="text-xl font-bold">{formatTime(categoryAnalytics.timeSpent || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-xl font-bold">{(categoryAnalytics.averageScore || 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Best Score</p>
                      <p className="text-xl font-bold">{categoryAnalytics.bestScore || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-category-topics">
                <CardHeader>
                  <CardTitle>Topic Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Strong Topics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categoryAnalytics.strongTopics && categoryAnalytics.strongTopics.length > 0 ? (
                        categoryAnalytics.strongTopics.map((topic: string, idx: number) => (
                          <Badge key={idx} variant="default">{topic}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Keep practicing to identify strong areas</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Areas for Improvement
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categoryAnalytics.weakTopics && categoryAnalytics.weakTopics.length > 0 ? (
                        categoryAnalytics.weakTopics.map((topic: string, idx: number) => (
                          <Badge key={idx} variant="destructive">{topic}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Great job! No weak areas identified</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Scores Chart */}
              <Card className="md:col-span-2" data-testid="card-recent-scores">
                <CardHeader>
                  <CardTitle>Recent Scores</CardTitle>
                  <CardDescription>Your performance in the last attempts</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryAnalytics.recentScores && categoryAnalytics.recentScores.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={categoryAnalytics.recentScores.map((score: number, idx: number) => ({
                        attempt: `#${categoryAnalytics.recentScores.length - idx}`,
                        score,
                      })).reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="attempt" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No quiz attempts yet for this category. Start practicing to see your progress!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {selectedCategory === "all" && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Select a category to view detailed analytics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={trendDays.toString()} onValueChange={(val) => setTrendDays(parseInt(val))}>
              <SelectTrigger className="w-[200px]" data-testid="select-trend-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card data-testid="card-performance-trend">
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Your quiz scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTrend ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : trendError ? (
                <div className="text-center py-8 text-destructive">
                  <p>Failed to load performance trend</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {trendError instanceof Error ? trendError.message : "An error occurred"}
                  </p>
                </div>
              ) : performanceTrend && performanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} name="Score %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No performance data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          {overallAnalytics && overallAnalytics.filter(c => c.analytics && c.analytics.totalAttempts > 0).length > 0 && (
            <Card data-testid="card-category-distribution">
              <CardHeader>
                <CardTitle>Practice Distribution</CardTitle>
                <CardDescription>Number of attempts per category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overallAnalytics.filter(c => c.analytics && c.analytics.totalAttempts > 0).map(cat => ({
                    name: cat.categoryName.length > 15 ? cat.categoryName.substring(0, 15) + "..." : cat.categoryName,
                    attempts: cat.analytics?.totalAttempts || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attempts" fill="#8884d8" name="Attempts" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
