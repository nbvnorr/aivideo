import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, Eye, Heart, TrendingUp, Clock } from 'lucide-react';
import { fetchDashboardStats } from '../../store/slices/videosSlice';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, isLoading } = useSelector((state) => state.videos);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const stats = [
    {
      title: 'Total Videos',
      value: dashboardStats?.totalVideos || 0,
      icon: Eye,
      color: 'text-blue-600',
    },
    {
      title: 'Total Views',
      value: dashboardStats?.totalViews || 0,
      icon: Eye,
      color: 'text-green-600',
    },
    {
      title: 'Total Likes',
      value: dashboardStats?.totalLikes || 0,
      icon: Heart,
      color: 'text-red-600',
    },
    {
      title: 'Avg Engagement',
      value: `${(dashboardStats?.avgEngagement || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your video content today.
          </p>
        </div>
        <Link to="/projects/new">
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Projects and Scheduled Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats?.recentVideos?.length > 0 ? (
                dashboardStats.recentVideos.map((video) => (
                  <div key={video._id} className="flex items-center space-x-4">
                    <div className="w-16 h-12 bg-muted rounded-lg flex items-center justify-center">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Eye className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{video.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          video.status === 'completed' ? 'default' :
                          video.status === 'processing' ? 'secondary' :
                          'outline'
                        }>
                          {video.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No recent projects. Create your first video!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats?.scheduledVideos?.length > 0 ? (
                dashboardStats.scheduledVideos.map((video) => (
                  <div key={video._id} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{video.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(video.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No scheduled posts.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

