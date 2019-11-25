export interface RandomGenerator {
    integer(min: number, max: number): Promise<number[]>;
}
