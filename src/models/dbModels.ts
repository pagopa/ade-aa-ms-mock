import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  Association,
  NonAttribute,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyAddAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManyHasAssociationMixin,
  BelongsToManyHasAssociationsMixin,
  BelongsToManyCountAssociationsMixin,
  BelongsToManyCreateAssociationMixin,
} from "sequelize";

export class Organization extends Model<
  InferAttributes<Organization>,
  InferCreationAttributes<Organization>
> {
  declare fiscalCode: string;
  declare name: string;
  declare pec: string;
  declare insertedAt: string;
  declare referents: NonAttribute<Referent[]>;

  declare getReferents: BelongsToManyGetAssociationsMixin<Referent>;
  declare addReferent: BelongsToManyAddAssociationMixin<Referent, string>;
  declare addReferents: BelongsToManyAddAssociationsMixin<Referent, string>;
  declare setReferents: BelongsToManySetAssociationsMixin<Referent, string>;
  declare removeReferent: BelongsToManyRemoveAssociationMixin<Referent, string>;
  declare removeReferents: BelongsToManyRemoveAssociationsMixin<
    Referent,
    string
  >;
  declare hasReferent: BelongsToManyHasAssociationMixin<Referent, string>;
  declare hasReferents: BelongsToManyHasAssociationsMixin<Referent, string>;
  declare countReferents: BelongsToManyCountAssociationsMixin;
  declare createReferent: BelongsToManyCreateAssociationMixin<Referent>;

  declare static associations: {
    referents: Association<Organization, Referent>;
  };
}

export class Referent extends Model<
  InferAttributes<Referent>,
  InferCreationAttributes<Referent>
> {
  declare fiscalCode: string;
  declare organizations: NonAttribute<Organization[]>;
  declare static associations: {
    organizations: Association<Referent, Organization>;
  };
}

export const initModels = (db: Sequelize) => {
  Organization.init(
    {
      fiscalCode: {
        type: DataTypes.STRING(16),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
      },
      pec: {
        type: DataTypes.STRING(100),
      },
      insertedAt: {
        type: DataTypes.DATE,
        defaultValue: new Date(),
      },
    },
    {
      sequelize: db,
      modelName: "organization",
      timestamps: false,
      underscored: true,
    }
  );

  Referent.init(
    {
      fiscalCode: {
        type: DataTypes.STRING(16),
        primaryKey: true,
      },
    },
    {
      sequelize: db,
      modelName: "referent",
      timestamps: false,
      underscored: true,
    }
  );

  Organization.associations.referents = Organization.belongsToMany(Referent, {
    through: "organizations_referents",
  });

  Referent.associations.organizations = Referent.belongsToMany(Organization, {
    through: "organizations_referents",
  });

  db.sync({ alter: true });
};
