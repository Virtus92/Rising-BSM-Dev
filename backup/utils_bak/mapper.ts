/**
 * Generic mapper utilities to convert between DTOs and entities
 */
export class Mapper {
  /**
   * Map from an entity to a DTO
   */
  static toDto<TEntity, TDto>(
    entity: TEntity, 
    mappingFn: (entity: TEntity) => TDto
  ): TDto {
    return mappingFn(entity);
  }
  
  /**
   * Map from a DTO to an entity
   */
  static toEntity<TDto, TEntity>(
    dto: TDto, 
    mappingFn: (dto: TDto) => TEntity
  ): TEntity {
    return mappingFn(dto);
  }
  
  /**
   * Map an array of entities to an array of DTOs
   */
  static toDtoList<TEntity, TDto>(
    entities: TEntity[], 
    mappingFn: (entity: TEntity) => TDto
  ): TDto[] {
    return entities.map(entity => this.toDto(entity, mappingFn));
  }
  
  /**
   * Map an array of DTOs to an array of entities
   */
  static toEntityList<TDto, TEntity>(
    dtos: TDto[], 
    mappingFn: (dto: TDto) => TEntity
  ): TEntity[] {
    return dtos.map(dto => this.toEntity(dto, mappingFn));
  }
}
