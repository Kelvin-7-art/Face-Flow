import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, CalendarCheck, Clock, UserPlus, Camera, ClipboardList, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { DashboardStats, Attendance } from "@shared/schema";
import { format } from "date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-4xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              {value}
            </p>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-all hover-elevate">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </CardContent>
      </Card>
    </Link>
  );
}

function RecentActivityItem({ record }: { record: Attendance }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium" data-testid={`activity-name-${record.id}`}>{record.fullName}</p>
          <p className="font-mono text-xs text-muted-foreground">{record.personId}</p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant="secondary" className="text-xs">
          {format(new Date(record.timestamp), "h:mm a")}
        </Badge>
        {record.distance && (
          <p className="mt-1 text-xs text-muted-foreground">
            {(1 - record.distance).toFixed(0)}% match
          </p>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-8 py-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="text-page-title">
          Face Recognition Attendance System
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Register people, take attendance using facial recognition, and track attendance logs effortlessly.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold">Dashboard Overview</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {isLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatCard
                title="Registered People"
                value={stats?.totalPeople ?? 0}
                icon={Users}
                description="Total profiles in system"
              />
              <StatCard
                title="Today's Attendance"
                value={stats?.todayAttendance ?? 0}
                icon={CalendarCheck}
                description="Marked present today"
              />
              <StatCard
                title="System Status"
                value="Active"
                icon={Clock}
                description="Face detection ready"
              />
            </>
          )}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <QuickActionCard
            title="Register Person"
            description="Add a new person to the system"
            href="/register"
            icon={UserPlus}
          />
          <QuickActionCard
            title="Take Attendance"
            description="Mark attendance using face recognition"
            href="/attendance"
            icon={Camera}
          />
          <QuickActionCard
            title="View Logs"
            description="See attendance history and export"
            href="/logs"
            icon={ClipboardList}
          />
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Link href="/logs">
            <Button variant="ghost" size="sm" data-testid="link-view-all-logs">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </>
          ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((record) => (
              <RecentActivityItem key={record.id} record={record} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">No Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Start by registering people and taking attendance
                  </p>
                </div>
                <Link href="/register">
                  <Button data-testid="button-get-started">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
