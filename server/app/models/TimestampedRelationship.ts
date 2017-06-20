import {Relationship} from './Relationship';

export interface TimestampedRelationship extends Relationship {
	createdAt: number;
}
