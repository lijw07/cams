using Xunit;
using FluentAssertions;
using cams.Backend.Helpers;
using cams.Backend.Enums;
using System;
using System.Linq;

namespace Cams.Tests.Helpers
{
    public class DatabaseTypeHelperTests
    {
        #region GetDisplayName Tests

        [Theory]
        [InlineData(DatabaseType.SqlServer, "Microsoft SQL Server")]
        [InlineData(DatabaseType.MySQL, "MySQL")]
        [InlineData(DatabaseType.PostgreSQL, "PostgreSQL")]
        [InlineData(DatabaseType.Oracle, "Oracle Database")]
        [InlineData(DatabaseType.SQLite, "SQLite")]
        [InlineData(DatabaseType.MongoDB, "MongoDB")]
        [InlineData(DatabaseType.Redis, "Redis")]
        [InlineData(DatabaseType.RestApi, "REST API")]
        [InlineData(DatabaseType.GraphQL, "GraphQL API")]
        [InlineData(DatabaseType.WebSocket, "WebSocket")]
        [InlineData(DatabaseType.Custom, "Custom Connection")]
        public void GetDisplayName_WithValidDatabaseType_ReturnsCorrectDisplayName(DatabaseType type, string expectedDisplayName)
        {
            // Act
            var result = DatabaseTypeHelper.GetDisplayName(type);

            // Assert
            result.Should().Be(expectedDisplayName);
        }

        [Fact]
        public void GetDisplayName_WithInvalidDatabaseType_ReturnsToStringValue()
        {
            // Arrange
            var invalidType = (DatabaseType)999;

            // Act
            var result = DatabaseTypeHelper.GetDisplayName(invalidType);

            // Assert
            result.Should().Be(invalidType.ToString());
        }

        [Fact]
        public void GetDisplayName_WithAllKnownTypes_ReturnsNonEmptyStrings()
        {
            // Arrange
            var allTypes = Enum.GetValues<DatabaseType>();

            // Act & Assert
            foreach (var type in allTypes)
            {
                var displayName = DatabaseTypeHelper.GetDisplayName(type);
                displayName.Should().NotBeNullOrEmpty($"because {type} should have a display name");
            }
        }

        #endregion

        #region GetCategory Tests

        [Theory]
        [InlineData(DatabaseType.SqlServer, "Relational Database")]
        [InlineData(DatabaseType.MySQL, "Relational Database")]
        [InlineData(DatabaseType.PostgreSQL, "Relational Database")]
        [InlineData(DatabaseType.Oracle, "Relational Database")]
        [InlineData(DatabaseType.SQLite, "Relational Database")]
        [InlineData(DatabaseType.MongoDB, "Document Database")]
        [InlineData(DatabaseType.Redis, "Key-Value Store")]
        [InlineData(DatabaseType.RestApi, "API Connection")]
        [InlineData(DatabaseType.GraphQL, "API Connection")]
        [InlineData(DatabaseType.WebSocket, "API Connection")]
        [InlineData(DatabaseType.Custom, "Custom")]
        public void GetCategory_WithValidDatabaseType_ReturnsCorrectCategory(DatabaseType type, string expectedCategory)
        {
            // Act
            var result = DatabaseTypeHelper.GetCategory(type);

            // Assert
            result.Should().Be(expectedCategory);
        }

        [Fact]
        public void GetCategory_WithInvalidDatabaseType_ReturnsOther()
        {
            // Arrange
            var invalidType = (DatabaseType)999;

            // Act
            var result = DatabaseTypeHelper.GetCategory(invalidType);

            // Assert
            result.Should().Be("Other");
        }

        [Fact]
        public void GetCategory_WithAllKnownTypes_ReturnsValidCategories()
        {
            // Arrange
            var allTypes = Enum.GetValues<DatabaseType>();
            var validCategories = new[] { "Relational Database", "Document Database", "Key-Value Store", "API Connection", "Custom", "Other" };

            // Act & Assert
            foreach (var type in allTypes)
            {
                var category = DatabaseTypeHelper.GetCategory(type);
                validCategories.Should().Contain(category, $"because {type} should map to a valid category");
            }
        }

        #endregion

        #region GetAllDatabaseTypes Tests

        [Fact]
        public void GetAllDatabaseTypes_ReturnsAllEnumValues()
        {
            // Arrange
            var enumValues = Enum.GetValues<DatabaseType>();

            // Act
            var result = DatabaseTypeHelper.GetAllDatabaseTypes().ToList();

            // Assert
            result.Should().HaveCount(enumValues.Length);
            
            foreach (var enumValue in enumValues)
            {
                result.Should().Contain(info => info.Name == enumValue.ToString(), 
                    $"because {enumValue} should be included in the result");
            }
        }

        [Fact]
        public void GetAllDatabaseTypes_ReturnsCorrectMetadataForEachType()
        {
            // Act
            var result = DatabaseTypeHelper.GetAllDatabaseTypes().ToList();

            // Assert
            foreach (var info in result)
            {
                // Verify that each property is properly set
                info.Value.Should().BeGreaterOrEqualTo(0, "because enum values should be non-negative");
                info.Name.Should().NotBeNullOrEmpty("because each type should have a name");
                info.DisplayName.Should().NotBeNullOrEmpty("because each type should have a display name");
                info.Category.Should().NotBeNullOrEmpty("because each type should have a category");

                // Verify the value corresponds to a valid enum
                var enumValue = (DatabaseType)info.Value;
                info.Name.Should().Be(enumValue.ToString(), "because Name should match enum ToString()");
                info.DisplayName.Should().Be(DatabaseTypeHelper.GetDisplayName(enumValue), 
                    "because DisplayName should match GetDisplayName() result");
                info.Category.Should().Be(DatabaseTypeHelper.GetCategory(enumValue), 
                    "because Category should match GetCategory() result");
            }
        }

        [Fact]
        public void GetAllDatabaseTypes_ReturnsDistinctValues()
        {
            // Act
            var result = DatabaseTypeHelper.GetAllDatabaseTypes().ToList();

            // Assert
            var distinctValues = result.Select(info => info.Value).Distinct().ToList();
            distinctValues.Should().HaveCount(result.Count, "because all enum values should be unique");

            var distinctNames = result.Select(info => info.Name).Distinct().ToList();
            distinctNames.Should().HaveCount(result.Count, "because all enum names should be unique");
        }

        [Fact]
        public void GetAllDatabaseTypes_IncludesSpecificKnownTypes()
        {
            // Act
            var result = DatabaseTypeHelper.GetAllDatabaseTypes().ToList();

            // Assert
            result.Should().Contain(info => info.Name == "SqlServer" && info.DisplayName == "Microsoft SQL Server");
            result.Should().Contain(info => info.Name == "MySQL" && info.DisplayName == "MySQL");
            result.Should().Contain(info => info.Name == "PostgreSQL" && info.DisplayName == "PostgreSQL");
            result.Should().Contain(info => info.Name == "MongoDB" && info.DisplayName == "MongoDB");
            result.Should().Contain(info => info.Name == "RestApi" && info.DisplayName == "REST API");
            result.Should().Contain(info => info.Name == "Custom" && info.DisplayName == "Custom Connection");
        }

        #endregion

        #region IsRelationalDatabase Tests

        [Theory]
        [InlineData(DatabaseType.SqlServer, true)]
        [InlineData(DatabaseType.MySQL, true)]
        [InlineData(DatabaseType.PostgreSQL, true)]
        [InlineData(DatabaseType.Oracle, true)]
        [InlineData(DatabaseType.SQLite, true)]
        [InlineData(DatabaseType.MongoDB, false)]
        [InlineData(DatabaseType.Redis, false)]
        [InlineData(DatabaseType.RestApi, false)]
        [InlineData(DatabaseType.GraphQL, false)]
        [InlineData(DatabaseType.WebSocket, false)]
        [InlineData(DatabaseType.Custom, false)]
        public void IsRelationalDatabase_WithDatabaseType_ReturnsCorrectResult(DatabaseType type, bool expectedResult)
        {
            // Act
            var result = DatabaseTypeHelper.IsRelationalDatabase(type);

            // Assert
            result.Should().Be(expectedResult);
        }

        [Fact]
        public void IsRelationalDatabase_WithInvalidDatabaseType_ReturnsFalse()
        {
            // Arrange
            var invalidType = (DatabaseType)999;

            // Act
            var result = DatabaseTypeHelper.IsRelationalDatabase(invalidType);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsRelationalDatabase_ConsistentWithCategoryMapping()
        {
            // Arrange
            var allTypes = Enum.GetValues<DatabaseType>();

            // Act & Assert
            foreach (var type in allTypes)
            {
                var isRelational = DatabaseTypeHelper.IsRelationalDatabase(type);
                var category = DatabaseTypeHelper.GetCategory(type);

                if (isRelational)
                {
                    category.Should().Be("Relational Database", 
                        $"because {type} is marked as relational and should have 'Relational Database' category");
                }
                else
                {
                    category.Should().NotBe("Relational Database", 
                        $"because {type} is not marked as relational and should not have 'Relational Database' category");
                }
            }
        }

        #endregion

        #region IsApiConnection Tests

        [Theory]
        [InlineData(DatabaseType.RestApi, true)]
        [InlineData(DatabaseType.GraphQL, true)]
        [InlineData(DatabaseType.WebSocket, true)]
        [InlineData(DatabaseType.SqlServer, false)]
        [InlineData(DatabaseType.MySQL, false)]
        [InlineData(DatabaseType.PostgreSQL, false)]
        [InlineData(DatabaseType.Oracle, false)]
        [InlineData(DatabaseType.SQLite, false)]
        [InlineData(DatabaseType.MongoDB, false)]
        [InlineData(DatabaseType.Redis, false)]
        [InlineData(DatabaseType.Custom, false)]
        public void IsApiConnection_WithDatabaseType_ReturnsCorrectResult(DatabaseType type, bool expectedResult)
        {
            // Act
            var result = DatabaseTypeHelper.IsApiConnection(type);

            // Assert
            result.Should().Be(expectedResult);
        }

        [Fact]
        public void IsApiConnection_WithInvalidDatabaseType_ReturnsFalse()
        {
            // Arrange
            var invalidType = (DatabaseType)999;

            // Act
            var result = DatabaseTypeHelper.IsApiConnection(invalidType);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsApiConnection_ConsistentWithCategoryMapping()
        {
            // Arrange
            var allTypes = Enum.GetValues<DatabaseType>();

            // Act & Assert
            foreach (var type in allTypes)
            {
                var isApiConnection = DatabaseTypeHelper.IsApiConnection(type);
                var category = DatabaseTypeHelper.GetCategory(type);

                if (isApiConnection)
                {
                    category.Should().Be("API Connection", 
                        $"because {type} is marked as API connection and should have 'API Connection' category");
                }
                else if (category == "API Connection")
                {
                    // This should not happen - if category is API Connection, IsApiConnection should be true
                    Assert.Fail($"Type {type} has 'API Connection' category but IsApiConnection returned false");
                }
            }
        }

        #endregion

        #region DatabaseTypeInfo Tests

        [Fact]
        public void DatabaseTypeInfo_HasCorrectProperties()
        {
            // Act
            var info = new DatabaseTypeInfo
            {
                Value = 1,
                Name = "TestName",
                DisplayName = "Test Display Name",
                Category = "Test Category"
            };

            // Assert
            info.Value.Should().Be(1);
            info.Name.Should().Be("TestName");
            info.DisplayName.Should().Be("Test Display Name");
            info.Category.Should().Be("Test Category");
        }

        [Fact]
        public void DatabaseTypeInfo_DefaultConstructor_InitializesCorrectly()
        {
            // Act
            var info = new DatabaseTypeInfo();

            // Assert
            info.Value.Should().Be(0);
            info.Name.Should().Be(string.Empty);
            info.DisplayName.Should().Be(string.Empty);
            info.Category.Should().Be(string.Empty);
        }

        #endregion

        #region Integration Tests

        [Fact]
        public void AllHelperMethods_WorkTogetherConsistently()
        {
            // Arrange
            var allTypes = Enum.GetValues<DatabaseType>();

            // Act & Assert
            foreach (var type in allTypes)
            {
                var displayName = DatabaseTypeHelper.GetDisplayName(type);
                var category = DatabaseTypeHelper.GetCategory(type);
                var isRelational = DatabaseTypeHelper.IsRelationalDatabase(type);
                var isApi = DatabaseTypeHelper.IsApiConnection(type);

                // Verify no method returns null or empty for valid enum values
                displayName.Should().NotBeNullOrEmpty($"GetDisplayName should return valid string for {type}");
                category.Should().NotBeNullOrEmpty($"GetCategory should return valid string for {type}");

                // Verify logical consistency
                if (isRelational && isApi)
                {
                    Assert.Fail($"Type {type} cannot be both relational database and API connection");
                }

                // Verify category consistency
                if (isRelational)
                {
                    category.Should().Be("Relational Database");
                }

                if (isApi)
                {
                    category.Should().Be("API Connection");
                }
            }
        }

        [Fact]
        public void GetAllDatabaseTypes_ContainsConsistentDataForAllEnumValues()
        {
            // Arrange
            var allEnumTypes = Enum.GetValues<DatabaseType>();

            // Act
            var allDatabaseTypes = DatabaseTypeHelper.GetAllDatabaseTypes().ToList();

            // Assert
            foreach (var enumType in allEnumTypes)
            {
                var typeInfo = allDatabaseTypes.FirstOrDefault(info => info.Name == enumType.ToString());
                typeInfo.Should().NotBeNull($"because {enumType} should be included in GetAllDatabaseTypes result");

                // Verify all data is consistent with individual helper methods
                typeInfo!.Value.Should().Be((int)enumType);
                typeInfo.DisplayName.Should().Be(DatabaseTypeHelper.GetDisplayName(enumType));
                typeInfo.Category.Should().Be(DatabaseTypeHelper.GetCategory(enumType));
            }
        }

        #endregion
    }
}