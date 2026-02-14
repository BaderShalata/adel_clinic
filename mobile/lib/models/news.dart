class News {
  final String id;
  final String title;
  final String content;
  final String? imageURL;
  final String category;
  final String? author;
  final String? authorName;
  final bool isPublished;
  final DateTime? publishedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  News({
    required this.id,
    required this.title,
    required this.content,
    this.imageURL,
    required this.category,
    this.author,
    this.authorName,
    this.isPublished = false,
    this.publishedAt,
    this.createdAt,
    this.updatedAt,
  });

  static DateTime? _parseDate(dynamic date) {
    if (date == null) return null;
    if (date is DateTime) return date;
    if (date is String) return DateTime.tryParse(date);
    if (date is Map) {
      // Handle Firestore Timestamp format
      if (date['_seconds'] != null) {
        return DateTime.fromMillisecondsSinceEpoch(
          (date['_seconds'] as int) * 1000,
        );
      }
    }
    return null;
  }

  factory News.fromJson(Map<String, dynamic> json) {
    return News(
      id: json['id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      imageURL: json['imageURL'] as String?,
      category: json['category'] as String? ?? 'general',
      author: json['author'] as String?,
      authorName: json['authorName'] as String?,
      isPublished: json['isPublished'] as bool? ?? false,
      publishedAt: _parseDate(json['publishedAt']),
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      if (imageURL != null) 'imageURL': imageURL,
      'category': category,
      if (author != null) 'author': author,
      if (authorName != null) 'authorName': authorName,
      'isPublished': isPublished,
      if (publishedAt != null) 'publishedAt': publishedAt!.toIso8601String(),
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }
}
