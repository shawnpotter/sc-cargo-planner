// @/app/components/ContainerInfo.tsx
import { Container, Contract } from '@/constants/types'

interface ContainerInfoProps {
	readonly container: Container | null
	readonly contracts: Contract[]
}

/**
 * ContainerInfo component displays detailed information about a selected container.
 * @param {Container | null} container - The selected container.
 * @param {Contract[]} contracts - Array of contracts associated with the containers.
 */
function ContainerInfo({ container, contracts }: ContainerInfoProps) {
	if (!container || !contracts.length) return null

	const contract = contracts[container.contractIndex]
	const deliveryPoint = contract.deliveryPoints[container.deliveryIndex]
	const cargoTypeIndex = container.cargoTypeIndex ?? 0
	const cargoItem = deliveryPoint.cargo[cargoTypeIndex]

	return (
		<div>
			<h3>Container Details</h3>
			<div>
				<p>
					<span>Size:</span>
					<br /> {container.size} SCU
				</p>
				<p>
					<span>Origin:</span>
					<br /> {contract.origin}
				</p>
				<p>
					<span>Destination:</span> <br />
					{deliveryPoint.location}
				</p>
				<div>
					<p>
						<span>Contents:</span>
						<br />
						{cargoItem ? (
							<span>{cargoItem.cargoType}</span>
						) : (
							<span>Unknown</span>
						)}
					</p>
				</div>
			</div>
		</div>
	)
}

export { ContainerInfo }
