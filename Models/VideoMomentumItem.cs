namespace GateKPT.MusicOS.Models;

public sealed record VideoMomentumItem(
    string Id,
    string Platform,
    string VideoTitle,
    int Views,
    int Likes,
    int Comments,
    string BestComment,
    string AudienceSignal,
    string FollowUpAngle,
    string NextPost,
    string Status,
    string Notes,
    string CreatedAt,
    string UpdatedAt);
