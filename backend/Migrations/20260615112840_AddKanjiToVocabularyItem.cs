using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddKanjiToVocabularyItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "blocked_users",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    blocked_user_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_blocked_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "chat_rooms",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    level_id = table.Column<int>(type: "integer", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    avatar_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    max_members = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_by = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_rooms", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "friend_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    from_user_id = table.Column<int>(type: "integer", nullable: false),
                    to_user_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    responded_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_friend_requests", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "friendships",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    friend_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_friendships", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "learning_materials",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    lesson_id = table.Column<int>(type: "integer", nullable: true),
                    level_id = table.Column<int>(type: "integer", nullable: true),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    file_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    file_size_kb = table.Column<int>(type: "integer", nullable: true),
                    is_premium = table.Column<bool>(type: "boolean", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    download_count = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_learning_materials", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "level_up_results",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    test_id = table.Column<int>(type: "integer", nullable: false),
                    from_level = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    to_level = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    score = table.Column<int>(type: "integer", nullable: false),
                    max_score = table.Column<int>(type: "integer", nullable: false),
                    is_passed = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_level_up_results", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "level_up_tests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    from_level = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    to_level = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    total_points = table.Column<int>(type: "integer", nullable: false),
                    pass_score = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_level_up_tests", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "levels",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_levels", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "placement_results_app",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    correct_count = table.Column<int>(type: "integer", nullable: false),
                    total_count = table.Column<int>(type: "integer", nullable: false),
                    level_label = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_placement_results_app", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "post_comments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    post_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_post_comments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "post_reactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    post_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    emoji = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_post_reactions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "posts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    content = table.Column<string>(type: "text", nullable: true),
                    image_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_posts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reports",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    reporter_id = table.Column<int>(type: "integer", nullable: false),
                    reported_user_id = table.Column<int>(type: "integer", nullable: true),
                    message_id = table.Column<int>(type: "integer", nullable: true),
                    room_id = table.Column<int>(type: "integer", nullable: true),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    severity = table.Column<int>(type: "integer", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    assigned_moderator_id = table.Column<int>(type: "integer", nullable: true),
                    resolved_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    resolution_note = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reports", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "sensitive_keywords",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    keyword = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    severity = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_by = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sensitive_keywords", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "system_announcements",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    published_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    created_by = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_announcements", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user_online_status",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    last_seen_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_online_status", x => x.user_id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    google_sub = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    level_id = table.Column<int>(type: "integer", nullable: true),
                    exp = table.Column<int>(type: "integer", nullable: false),
                    streak_days = table.Column<int>(type: "integer", nullable: false),
                    last_streak_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    xu = table.Column<int>(type: "integer", nullable: false),
                    is_email_verified = table.Column<bool>(type: "boolean", nullable: false),
                    is_locked = table.Column<bool>(type: "boolean", nullable: false),
                    locked_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    locked_reason = table.Column<string>(type: "text", nullable: true),
                    last_login_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    is_premium = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "warnings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    moderator_id = table.Column<int>(type: "integer", nullable: false),
                    report_id = table.Column<int>(type: "integer", nullable: true),
                    reason = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warnings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "chat_room_members",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    room_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    joined_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    last_read_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_room_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_chat_room_members_chat_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "chat_rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "level_up_questions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    test_id = table.Column<int>(type: "integer", nullable: false),
                    order_index = table.Column<int>(type: "integer", nullable: false),
                    text = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    points = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_level_up_questions", x => x.id);
                    table.ForeignKey(
                        name: "FK_level_up_questions_level_up_tests_test_id",
                        column: x => x.test_id,
                        principalTable: "level_up_tests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lesson_categories",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    level_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    thumbnail_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_premium = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lesson_categories", x => x.id);
                    table.ForeignKey(
                        name: "FK_lesson_categories_levels_level_id",
                        column: x => x.level_id,
                        principalTable: "levels",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    conversation_id = table.Column<int>(type: "integer", nullable: false),
                    sender_id = table.Column<int>(type: "integer", nullable: false),
                    content = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    reply_to_id = table.Column<int>(type: "integer", nullable: true),
                    is_pinned = table.Column<bool>(type: "boolean", nullable: false),
                    pinned_by = table.Column<int>(type: "integer", nullable: true),
                    pinned_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_messages", x => x.id);
                    table.ForeignKey(
                        name: "FK_messages_chat_rooms_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "chat_rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_messages_messages_reply_to_id",
                        column: x => x.reply_to_id,
                        principalTable: "messages",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_messages_users_sender_id",
                        column: x => x.sender_id,
                        principalTable: "users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "password_reset_tokens",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    used_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_password_reset_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_password_reset_tokens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_profiles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    display_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    avatar_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    cover_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    bio = table.Column<string>(type: "text", nullable: true),
                    date_of_birth = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    privacy_profile = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    privacy_friend_request = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    theme = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_profiles", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "level_up_question_options",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    question_id = table.Column<int>(type: "integer", nullable: false),
                    option_key = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    text = table.Column<string>(type: "text", nullable: false),
                    is_correct = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_level_up_question_options", x => x.id);
                    table.ForeignKey(
                        name: "FK_level_up_question_options_level_up_questions_question_id",
                        column: x => x.question_id,
                        principalTable: "level_up_questions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lessons",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    category_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    content = table.Column<string>(type: "text", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    estimated_minutes = table.Column<int>(type: "integer", nullable: false),
                    is_premium = table.Column<bool>(type: "boolean", nullable: false),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    created_by = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lessons", x => x.id);
                    table.ForeignKey(
                        name: "FK_lessons_lesson_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "lesson_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "message_reactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    message_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    emoji = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_message_reactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_message_reactions_messages_message_id",
                        column: x => x.message_id,
                        principalTable: "messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "grammar_items",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    lesson_id = table.Column<int>(type: "integer", nullable: true),
                    pattern = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    structure = table.Column<string>(type: "text", nullable: true),
                    meaning_vi = table.Column<string>(type: "text", nullable: true),
                    meaning_en = table.Column<string>(type: "text", nullable: true),
                    example_sentences = table.Column<string>(type: "text", nullable: true),
                    level_id = table.Column<int>(type: "integer", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_grammar_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_grammar_items_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalTable: "lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_grammar_items_levels_level_id",
                        column: x => x.level_id,
                        principalTable: "levels",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "kanji_items",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    lesson_id = table.Column<int>(type: "integer", nullable: true),
                    character = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    readings_on = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    readings_kun = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    meaning_vi = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    meaning_en = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    stroke_count = table.Column<int>(type: "integer", nullable: true),
                    jlpt_level = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_kanji_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_kanji_items_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalTable: "lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "lesson_quiz_questions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    lesson_id = table.Column<int>(type: "integer", nullable: false),
                    question = table.Column<string>(type: "text", nullable: false),
                    options_json = table.Column<string>(type: "text", nullable: false),
                    correct_index = table.Column<int>(type: "integer", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lesson_quiz_questions", x => x.id);
                    table.ForeignKey(
                        name: "FK_lesson_quiz_questions_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalTable: "lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_bookmarks",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    lesson_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_bookmarks", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_bookmarks_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalTable: "lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_bookmarks_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_lesson_progress",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    lesson_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    progress_percent = table.Column<int>(type: "integer", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    last_accessed_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_lesson_progress", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_lesson_progress_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalTable: "lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_lesson_progress_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vocabulary_items",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    lesson_id = table.Column<int>(type: "integer", nullable: true),
                    word_jp = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Kanji = table.Column<string>(type: "text", nullable: true),
                    reading = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    meaning_vi = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    meaning_en = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    example_sentence = table.Column<string>(type: "text", nullable: true),
                    audio_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vocabulary_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_vocabulary_items_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalTable: "lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_blocked_users_user_id_blocked_user_id",
                table: "blocked_users",
                columns: new[] { "user_id", "blocked_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chat_room_members_room_id_user_id",
                table: "chat_room_members",
                columns: new[] { "room_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_friend_requests_from_user_id_to_user_id",
                table: "friend_requests",
                columns: new[] { "from_user_id", "to_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_friendships_user_id_friend_id",
                table: "friendships",
                columns: new[] { "user_id", "friend_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_grammar_items_lesson_id",
                table: "grammar_items",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "IX_grammar_items_level_id",
                table: "grammar_items",
                column: "level_id");

            migrationBuilder.CreateIndex(
                name: "IX_kanji_items_lesson_id",
                table: "kanji_items",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "IX_lesson_categories_level_id",
                table: "lesson_categories",
                column: "level_id");

            migrationBuilder.CreateIndex(
                name: "IX_lesson_quiz_questions_lesson_id_sort_order",
                table: "lesson_quiz_questions",
                columns: new[] { "lesson_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "IX_lessons_category_id_is_published_sort_order",
                table: "lessons",
                columns: new[] { "category_id", "is_published", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "IX_level_up_question_options_question_id",
                table: "level_up_question_options",
                column: "question_id");

            migrationBuilder.CreateIndex(
                name: "IX_level_up_questions_test_id",
                table: "level_up_questions",
                column: "test_id");

            migrationBuilder.CreateIndex(
                name: "IX_level_up_results_user_id_created_at",
                table: "level_up_results",
                columns: new[] { "user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_message_reactions_message_id_user_id_emoji",
                table: "message_reactions",
                columns: new[] { "message_id", "user_id", "emoji" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_messages_conversation_id",
                table: "messages",
                column: "conversation_id");

            migrationBuilder.CreateIndex(
                name: "IX_messages_reply_to_id",
                table: "messages",
                column: "reply_to_id");

            migrationBuilder.CreateIndex(
                name: "IX_messages_sender_id",
                table: "messages",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_tokens_token",
                table: "password_reset_tokens",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_tokens_user_id",
                table: "password_reset_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_placement_results_app_user_id_created_at",
                table: "placement_results_app",
                columns: new[] { "user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_post_comments_post_id_created_at",
                table: "post_comments",
                columns: new[] { "post_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_post_reactions_post_id_user_id_emoji",
                table: "post_reactions",
                columns: new[] { "post_id", "user_id", "emoji" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_posts_user_id_created_at",
                table: "posts",
                columns: new[] { "user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_user_bookmarks_lesson_id",
                table: "user_bookmarks",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_bookmarks_user_id_lesson_id",
                table: "user_bookmarks",
                columns: new[] { "user_id", "lesson_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_lesson_progress_lesson_id",
                table: "user_lesson_progress",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_lesson_progress_user_id_lesson_id",
                table: "user_lesson_progress",
                columns: new[] { "user_id", "lesson_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_profiles_user_id",
                table: "user_profiles",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "UX_users_google_sub",
                table: "users",
                column: "google_sub",
                unique: true,
                filter: "google_sub IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_vocabulary_items_lesson_id",
                table: "vocabulary_items",
                column: "lesson_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "blocked_users");

            migrationBuilder.DropTable(
                name: "chat_room_members");

            migrationBuilder.DropTable(
                name: "friend_requests");

            migrationBuilder.DropTable(
                name: "friendships");

            migrationBuilder.DropTable(
                name: "grammar_items");

            migrationBuilder.DropTable(
                name: "kanji_items");

            migrationBuilder.DropTable(
                name: "learning_materials");

            migrationBuilder.DropTable(
                name: "lesson_quiz_questions");

            migrationBuilder.DropTable(
                name: "level_up_question_options");

            migrationBuilder.DropTable(
                name: "level_up_results");

            migrationBuilder.DropTable(
                name: "message_reactions");

            migrationBuilder.DropTable(
                name: "password_reset_tokens");

            migrationBuilder.DropTable(
                name: "placement_results_app");

            migrationBuilder.DropTable(
                name: "post_comments");

            migrationBuilder.DropTable(
                name: "post_reactions");

            migrationBuilder.DropTable(
                name: "posts");

            migrationBuilder.DropTable(
                name: "reports");

            migrationBuilder.DropTable(
                name: "sensitive_keywords");

            migrationBuilder.DropTable(
                name: "system_announcements");

            migrationBuilder.DropTable(
                name: "user_bookmarks");

            migrationBuilder.DropTable(
                name: "user_lesson_progress");

            migrationBuilder.DropTable(
                name: "user_online_status");

            migrationBuilder.DropTable(
                name: "user_profiles");

            migrationBuilder.DropTable(
                name: "vocabulary_items");

            migrationBuilder.DropTable(
                name: "warnings");

            migrationBuilder.DropTable(
                name: "level_up_questions");

            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "lessons");

            migrationBuilder.DropTable(
                name: "level_up_tests");

            migrationBuilder.DropTable(
                name: "chat_rooms");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "lesson_categories");

            migrationBuilder.DropTable(
                name: "levels");
        }
    }
}
