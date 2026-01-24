import { Prisma } from '@prisma/client';
import { formatGraphName } from './nameUtils';

export interface GraphNode {
  id: string;
  label: string;
  groups: string[];
  colors: string[];
  isCenter: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  color: string;
}

type PersonId = Prisma.PersonGetPayload<{
  select: { id: true };
}>;

type RelationshipToUser = Prisma.RelationshipTypeGetPayload<{
  select: { label: true; color: true };
}>;

type InverseRelationship = Prisma.RelationshipTypeGetPayload<{
  select: { label: true; color: true };
}>;

interface PersonWithRelationshipToUser extends PersonId {
  relationshipToUser:
    | (RelationshipToUser & {
        inverse: InverseRelationship | null;
      })
    | null;
}

export function relationshipsWithUserToGraphEdges(
  person: PersonWithRelationshipToUser,
  userId: string,
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  // Add edge from person to user (their relationship to you) if direct relationship exists
  if (person.relationshipToUser) {
    edges.push({
      source: person.id,
      target: userId,
      type: person.relationshipToUser.label,
      color: person.relationshipToUser.color || '#9CA3AF',
    });
  }

  // Add edge from user to person (your relationship to them) if inverse relationship exists
  if (person.relationshipToUser?.inverse) {
    edges.push({
      source: userId,
      target: person.id,
      type: person.relationshipToUser.inverse.label,
      color: person.relationshipToUser.inverse.color || '#9CA3AF',
    });
  }
  return edges;
}

type Relationship = Prisma.RelationshipGetPayload<{
  select: {
    personId: true;
    relatedPersonId: true;
    relationshipType: { select: { label: true; color: true } };
  };
}>;

export function relationshipToGraphEdge(
  relationship: Relationship,
): GraphEdge | undefined {
  if (!relationship.relationshipType) {
    return;
  }
  return {
    source: relationship.personId,
    target: relationship.relatedPersonId,
    type: relationship.relationshipType.label,
    color: relationship.relationshipType.color || '#999999',
  };
}

interface RelationshipWithInverse extends Relationship {
  relationshipType:
    | (Relationship['relationshipType'] & {
        inverse: InverseRelationship | null;
      })
    | null;
}
export function relationshipToInverseGraphEdge(
  relationship: RelationshipWithInverse,
): GraphEdge | undefined {
  if (!relationship.relationshipType?.inverse) {
    return;
  }
  return {
    source: relationship.relatedPersonId,
    target: relationship.personId,
    type: relationship.relationshipType.inverse.label,
    color: relationship.relationshipType.inverse.color || '#999999',
  };
}

type Person = Prisma.PersonGetPayload<{
  include: { groups: { include: { group: true } } };
}>;

export function personToGraphNode(person: Person, isCenter = false): GraphNode {
  return {
    id: person.id,
    label: formatGraphName(person),
    groups: person.groups.map((pg) => pg.group.name),
    colors: person.groups.map((pg) => pg.group.color || '#3B82F6'),
    isCenter,
  };
}

export function getUserNode(id: string, isCenter = false): GraphNode {
  return {
    id,
    label: 'You',
    groups: [],
    colors: [],
    isCenter,
  };
}
