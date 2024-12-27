import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { createBlogInput, updateBlogInput } from "@somuraj7/blog-common";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono <{
    Bindings: {
      DATABASE_URL :string,
      JWT_SECERT : string
    },
    Variables: {
            userId: string
        }
    
  }>();
blogRouter.use("/*",async (c, next) => {
    const authHeader = c.req.header("authorization") || ""

    try {
      const user = await verify(authHeader,c.env.JWT_SECERT);
    if (user){
        c.set("userId", user.id as string);
       await next();
    }else {
        c.status(403)
        return c.json({
            message: "u r not loggin in"
        })
    }
    } catch (e) {
      c.status(403)
      return c.json({
          message: "u r not loggin in"
      })
    }
    
    }       
    )

blogRouter.post('/', async (c) => {
    const body = await c.req.json();

    const { success } = createBlogInput.safeParse(body);
    if (!success){
      c.status(411)
      return c.json({
        message : "inputs are not corect "
      })
    }
    const authorID = c.get("userId")
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.create({
      data: {
        title: body.title,
        content: body.content,
        authorID: Number(authorID)
      }
    })
    return c.json({
        id:blog.id
    })
  })

  blogRouter.put('/', async(c) => {
    const body = await c.req.json();
    const { success } = updateBlogInput.safeParse(body);
    if (!success){
      c.status(411)
      return c.json({
        message : "inputs are not corect "
      })
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await 
    prisma.blog.update({
        where: {
            id: body.id
        },
      data: {
        title: body.title,
        content: body.content,
      }
    })
    return c.json({
        id:blog.id
    })
  })

  blogRouter.get('/bluk ', async(c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blogs = await prisma.blog.findMany({
      select : {
        id: true,
        title: true,
        content: true,
        author: {
          select: {
            name: true
          }
        }
      }
    });
    return c.json({
        blogs
    })
  })

  blogRouter.get('/:id', async(c) => {
    const id = c.req.param("id")
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())


    try {
        const blog = await 
    prisma.blog.findFirst({
        where: {
            id:Number(id)
        },
        select: {
          id: true,
          title: true,
          content: true,
          author: {
            select: {
              name: true
            }
          }
        }
    })
    return c.json({
        blog
    })
    } catch (e) {
        c.status(411);
        return c.json({
            message: "invalid while fetching blog"
        })
    }
    
  })

  
 
