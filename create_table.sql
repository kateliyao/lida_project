CREATE TABLE dw.users_info (
id int primary key,
username varchar(20) not NULL,
password varchar(50) not NULL,
role varchar(20) not NULL,
updated_time datetime DEFAULT NOW()
)

insert dw.users_info(id,username,password,role) values(1,'lda1','lidadmin1','admin');
insert dw.users_info(id,username,password,role) values(2,'lda2','lidadmin2','admin');
insert dw.users_info(id,username,password,role) values(3,'ld1','ld1','user');
insert dw.users_info(id,username,password,role) values(4,'ld2','ld2','user');
insert dw.users_info(id,username,password,role) values(5,'ld3','ld3','user');
insert dw.users_info(id,username,password,role) values(6,'ld4','ld4','user');
insert dw.users_info(id,username,password,role) values(7,'ld5','ld5','user');
insert dw.users_info(id,username,password,role) values(8,'ld6','ld6','user');
insert dw.users_info(id,username,password,role) values(9,'ld7','ld7','user');
insert dw.users_info(id,username,password,role) values(10,'ld8','ld8','user');

select * from dw.users_info


CREATE TABLE dw.company_info (
company_id varchar(20) primary key,
company_name varchar(50) not NULL,
updated_time datetime DEFAULT NOW()
)

insert dw.company_info(company_id,company_name) values('liyao','澧曜數據')
insert dw.company_info(company_id,company_name) values('lida','力達稅務記帳士事務所')

select * from dw.company_info

drop table dw.formA
CREATE TABLE dw.formA (
    form_id VARCHAR(255) PRIMARY KEY,
    company_id varchar(20) not null,
    company_name varchar(50) not NULL,
    form_type varchar(20) DEFAULT 'A',
    form_titleyear INT not null,
    form_titlemonth INT not null,
    revenue DECIMAL(15, 2) not null,
    cost DECIMAL(15, 2) not null,
    expense DECIMAL(15, 2) not null,
    profit DECIMAL(15, 2) not null,
    nonrevenue DECIMAL(15, 2) not null,
    noncost DECIMAL(15, 2) not null,
    income DECIMAL(15, 2) not null,
    revenue_percent DECIMAL(15, 2) DEFAULT 100,
    cost_percent DECIMAL(15, 2) not null,
    expense_percent DECIMAL(15, 2) not null,
    profit_percent DECIMAL(15, 2) not null,
    nonrevenue_percent DECIMAL(15, 2) not null,
    noncost_percent DECIMAL(15, 2) not null,
    income_percent DECIMAL(15, 2) not null,
    ischecked VARCHAR(1) NULL,
    netincome DECIMAL(15, 2) NULL,
    extracost DECIMAL(15, 2) NULL,
    extraexpense DECIMAL(15, 2) NULL,
    note VARCHAR(512) NULL,
    staff varchar(20) not null,
    form_submityear INT not null,
    form_submitmonth INT not null,
    form_submitdate INT not null,
    pdf_name VARCHAR(255) NULL,
    form_status int DEFAULT 0,
	user_name varchar(20) not NULL,
	send_mail_pdf_name VARCHAR(255) NULL,
    updated_time datetime DEFAULT NOW()
);

select * from dw.formA
truncate table dw.formA

drop table dw.staff_info
CREATE TABLE dw.staff_info (
    staff_id int PRIMARY KEY,
    staff_name varchar(20) not null,
    staff_menu varchar(50) not null,
    updated_time datetime DEFAULT NOW()
);

insert into dw.staff_info(staff_id,staff_name,staff_menu) values(101,'王小明','#101王先生');
insert into dw.staff_info(staff_id,staff_name,staff_menu) values(102,'陳明月','#102陳小姐');

select * from dw.staff_info

CREATE TABLE dw.pdf_merge_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    system_date VARCHAR(255) NOT NULL,
    merge_pdf_name VARCHAR(255) NOT NULL,
    updated_time datetime DEFAULT NOW()
);


CREATE TABLE dw.users_info (
id int primary key,
username varchar(20) not NULL,
password varchar(50) not NULL,
role varchar(20) NULL,
staff_menu varchar(50) null,
updated_time datetime DEFAULT NOW()
)

insert dw.users_info(id,username,password,role,staff_menu) values(1,'lda1','lidadmin1','admin',null);
insert dw.users_info(id,username,password,role,staff_menu) values(2,'lda2','lidadmin2','admin',null);
insert dw.users_info(id,username,password,role,staff_menu) values(3,'ld1','ld1','user','蔡小姐#101');
insert dw.users_info(id,username,password,role,staff_menu) values(4,'ld2','ld2','user','施先生#102');
insert dw.users_info(id,username,password,role,staff_menu) values(5,'ld3','ld3','user','楊小姐#103');
insert dw.users_info(id,username,password,role,staff_menu) values(6,'ld4','ld4','user','賴小姐#106');
insert dw.users_info(id,username,password,role,staff_menu) values(7,'ld5','ld5','user','陳小姐#107');
insert dw.users_info(id,username,password,role,staff_menu) values(8,'ld6','ld6','user','洪小姐#108');
insert dw.users_info(id,username,password,role,staff_menu) values(9,'ld7','ld7','user','潘小姐#111');
insert dw.users_info(id,username,password,role,staff_menu) values(10,'ld8','ld8','user','林小姐#168');
