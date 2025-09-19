// @/utils/routingStrategies/IRoutingStrategy.ts
import { RouteGraph } from '@/utils/graph'

export interface IRoutingStrategy {
	findRoute(start: string, destinations: string[], graph: RouteGraph): string[]
}
