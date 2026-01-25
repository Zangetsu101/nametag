import { prisma } from '@/lib/prisma';
import { apiResponse, handleApiError, withAuth } from '@/lib/api-utils';
import type { GraphNode, GraphEdge } from '@/lib/graph-utils';
import {
    userToGraphNode,
  personToGraphNode,
  relationshipsWithUserToGraphEdges,
  relationshipToGraphEdge,
  relationshipToInverseGraphEdge,
} from '@/lib/graph-utils';

export const GET = withAuth(async (_request, session, context) => {
  try {
    const { id } = await context!.params;

    // Fetch the person with all their relationships
    const person = await prisma.person.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        relationshipToUser: {
          include: {
            inverse: {
              where: {
                deletedAt: null,
              },
            },
          },
          where: {
            deletedAt: null,
          },
        },
        groups: {
          where: {
            group: {
              deletedAt: null,
            },
          },
          include: {
            group: true,
          },
        },
        relationshipsFrom: {
          where: {
            deletedAt: null,
            relatedPerson: {
              deletedAt: null,
            },
          },
          include: {
            relatedPerson: {
              include: {
                relationshipToUser: {
                  include: {
                    inverse: {
                      where: {
                        deletedAt: null,
                      },
                    },
                  },
                  where: {
                    deletedAt: null,
                  },
                },
                groups: {
                  where: {
                    group: {
                      deletedAt: null,
                    },
                  },
                  include: {
                    group: true,
                  },
                },
                // Fetch relationships between connected people
                relationshipsFrom: {
                  where: {
                    deletedAt: null,
                    relatedPerson: {
                      deletedAt: null,
                    },
                  },
                  include: {
                    relationshipType: {
                      where: {
                        deletedAt: null,
                      },
                      include: {
                        inverse: {
                          where: {
                            deletedAt: null,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            relationshipType: {
              where: {
                deletedAt: null,
              },
              include: {
                inverse: {
                  where: {
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!person) {
      return apiResponse.notFound('Person not found');
    }

    // Build graph data
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeIds = new Set<string>();

    // Add center node (the person we're viewing)
    nodes.push(personToGraphNode(person, true));
    nodeIds.add(person.id);

    // Add user as a node
    const userId = `user-${session.user.id}`;
    nodes.push(userToGraphNode(userId));
    nodeIds.add(userId);

    // if person has direct relationship to user, add them
    edges.push(...relationshipsWithUserToGraphEdges(person, userId));

    // Add related people as nodes
    person.relationshipsFrom.forEach((rel) => {
      if (!nodeIds.has(rel.relatedPersonId)) {
        nodes.push(personToGraphNode(rel.relatedPerson));
        nodeIds.add(rel.relatedPersonId);
      }

      // If the related person has direct relationship to the user, add them
      edges.push(
        ...relationshipsWithUserToGraphEdges(rel.relatedPerson, userId),
      );
    });

    // Build edges with deduplication
    const dedupedEdges = new Set<GraphEdge>();

    // Add edges from center person to related people
    person.relationshipsFrom
      .map(relationshipToGraphEdge)
      .filter((e) => e !== undefined)
      .forEach((e) => dedupedEdges.add(e));

    person.relationshipsFrom
      .map(relationshipToInverseGraphEdge)
      .filter((e) => e !== undefined)
      .forEach((e) => dedupedEdges.add(e));

    // Add edges between related people (relationships within the network)
    person.relationshipsFrom.forEach((rel) => {
      if (!rel.relatedPerson.relationshipsFrom) {
        return;
      }

      rel.relatedPerson.relationshipsFrom
        .map(relationshipToGraphEdge)
        .filter((e) => e !== undefined)
        .forEach((e) => dedupedEdges.add(e));

      rel.relatedPerson.relationshipsFrom
        .map(relationshipToInverseGraphEdge)
        .filter((e) => e !== undefined)
        .forEach((e) => dedupedEdges.add(e));
    });

    edges.push(...Array.from(dedupedEdges));

    return apiResponse.ok({ nodes, edges });
  } catch (error) {
    return handleApiError(error, 'people-graph');
  }
});
