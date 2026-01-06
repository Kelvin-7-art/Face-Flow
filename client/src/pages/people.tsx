import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, Search, Trash2, UserPlus, AlertTriangle, User } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Person } from "@shared/schema";

function PersonCard({
  person,
  onDelete,
  isDeleting,
}: {
  person: Person;
  onDelete: (personId: string) => void;
  isDeleting: boolean;
}) {
  const initials = person.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="overflow-hidden" data-testid={`card-person-${person.personId}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="truncate font-semibold" data-testid={`text-name-${person.personId}`}>
              {person.fullName}
            </h3>
            <p className="truncate font-mono text-sm text-muted-foreground">
              {person.personId}
            </p>
            {person.role && (
              <Badge variant="secondary" className="mt-2">
                {person.role}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4">
          <div className="text-xs text-muted-foreground">
            <span>Registered: </span>
            <span>{format(new Date(person.createdAt), "MMM d, yyyy")}</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={isDeleting}
                data-testid={`button-delete-${person.personId}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete Person
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{person.fullName}</strong>? This will
                  remove their profile and all face samples. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(person.personId)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default function People() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: people, isLoading } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (personId: string) => {
      await apiRequest("DELETE", `/api/people/${personId}`);
    },
    onSuccess: () => {
      toast({
        title: "Person Deleted",
        description: "The person has been removed from the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete person",
        variant: "destructive",
      });
    },
  });

  const filteredPeople = people?.filter(
    (person) =>
      person.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.personId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Manage People
          </h1>
          <p className="mt-1 text-muted-foreground">
            View and manage registered profiles
          </p>
        </div>
        <Link href="/register">
          <Button data-testid="button-add-person">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Person
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filteredPeople && filteredPeople.length > 0 ? (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredPeople.length} {filteredPeople.length === 1 ? "person" : "people"}
              {searchQuery && " found"}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPeople.map((person) => (
              <PersonCard
                key={person.personId}
                person={person}
                onDelete={deleteMutation.mutate}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-medium">
                {searchQuery ? "No People Found" : "No Registered People"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No profiles match your search criteria"
                  : "Start by registering people in the system"}
              </p>
            </div>
            {!searchQuery && (
              <Link href="/register">
                <Button data-testid="button-register-first">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register First Person
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
