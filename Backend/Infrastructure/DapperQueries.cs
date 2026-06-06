using System.Data;
using Dapper;

namespace Backend.Infrastructure;

public class DapperQueries
{
    private readonly IDbConnection _connection;

    public DapperQueries(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<IEnumerable<dynamic>> GetRecentMediaAsync(int limit = 20)
    {
        var sql = "SELECT Id, Title, FilePath, Duration, MediaType FROM MediaItems ORDER BY CreatedAt DESC LIMIT @Limit";
        return await _connection.QueryAsync(sql, new { Limit = limit });
    }
}
