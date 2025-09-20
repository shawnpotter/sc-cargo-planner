// @/app/components/ContainerInfo.tsx
import { Container, Contract } from '@/constants/types'

interface ContainerInfoProps {
	readonly container: Container | null
	readonly contracts: Contract[]
}

/**
 * Displays detailed information about a specific cargo container, including its size,
 * origin, destination, and contents. The component expects a container object and a list
 * of contracts, and renders relevant details based on the container's indices.
 *
 * @param {ContainerInfoProps} props - The properties for the component.
 * @param {Container} props.container - The container object containing indices and size.
 * @param {Contract[]} props.contracts - The list of contracts associated with the container.
 * @returns {JSX.Element | null} The rendered container information, or null if data is missing.
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
